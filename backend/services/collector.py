"""Collect and normalize social media posts from supported platforms."""

import logging
import os
import re
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import requests


logger = logging.getLogger(__name__)

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/commentThreads"

APIVIEW_URL = "https://public.api.bsky.app/xrpc"
POST_URL_PATTERN = re.compile(
	r"^https://bsky\.app/profile/(?P<handle>[^/\s]+)/post/(?P<post_id>[^/\s]+)$",
	re.IGNORECASE,
)


def _request(endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
	response = requests.get(f"{APIVIEW_URL}/{endpoint}", params=params, timeout=10)
	response.raise_for_status()
	return response.json()


def _resolve_handle(handle: str) -> str:
	result = _request("app.bsky.identity.resolveHandle", {"handle": handle})
	return str(result["did"])


def _normalize_post(post: dict[str, Any]) -> dict[str, Any] | None:
	record = post.get("record") or {}
	author = post.get("author") or {}
	text = record.get("text")
	if not isinstance(text, str):
		return None

	return {
		"id": post.get("uri") or post.get("cid"),
		"text": text,
		"author": author.get("handle"),
		"timestamp": record.get("createdAt"),
		"source": "bluesky",
	}


def _flatten_thread(thread: dict[str, Any], posts: list[dict[str, Any]], max_posts: int) -> None:
	if len(posts) >= max_posts:
		return

	normalized = _normalize_post(thread.get("post") or {})
	if normalized:
		posts.append(normalized)

	for reply in thread.get("replies") or []:
		if len(posts) >= max_posts:
			return
		if isinstance(reply, dict):
			_flatten_thread(reply, posts, max_posts)


def _post_from_url(url: str, max_posts: int) -> list[dict[str, Any]]:
	match = POST_URL_PATTERN.match(url)
	if not match:
		return []

	handle = unquote(match.group("handle"))
	post_id = unquote(match.group("post_id"))
	did = _resolve_handle(handle)
	at_uri = f"at://{did}/app.bsky.feed.post/{post_id}"
	result = _request(
		"app.bsky.feed.getPostThread",
		{"uri": at_uri, "depth": 50},
	)
	posts: list[dict[str, Any]] = []
	_flatten_thread(result.get("thread") or {}, posts, max_posts)
	return posts


def _search_posts(query: str, max_posts: int) -> list[dict[str, Any]]:
	posts: list[dict[str, Any]] = []
	cursor: str | None = None

	while len(posts) < max_posts:
		remaining = min(100, max_posts - len(posts))
		params: dict[str, Any] = {"q": query, "limit": remaining, "sort": "latest"}
		if cursor:
			params["cursor"] = cursor

		result = _request("app.bsky.feed.searchPosts", params)
		for post in result.get("posts") or []:
			normalized = _normalize_post(post)
			if normalized:
				posts.append(normalized)
				if len(posts) >= max_posts:
					break

		cursor = result.get("cursor")
		if not cursor or not result.get("posts"):
			break

	return posts


def fetch_bluesky_posts(query_or_url: str, max_posts: int = 200) -> list[dict[str, Any]]:
	"""Fetch a Bluesky post thread or search results through the public AppView API."""
	try:
		if max_posts <= 0:
			return []

		value = query_or_url.strip()
		if POST_URL_PATTERN.match(value):
			return _post_from_url(value, max_posts)
		return _search_posts(value, max_posts)
	except (KeyError, TypeError, ValueError, requests.RequestException) as error:
		logger.exception("Failed to fetch Bluesky posts: %s", error)
		return []


def fetch_youtube_comments(video_url: str, max_posts: int = 200) -> list[dict[str, Any]]:
	"""Fetch top-level YouTube comments for a video URL."""
	try:
		api_key = os.getenv("YOUTUBE_API_KEY")
		if not api_key or max_posts <= 0:
			return []

		parsed_url = urlparse(video_url)
		video_id = parse_qs(parsed_url.query).get("v", [None])[0]
		if not video_id and parsed_url.netloc.lower() in {"youtu.be", "www.youtu.be"}:
			video_id = parsed_url.path.strip("/").split("/")[0]
		if not video_id:
			return []

		posts: list[dict[str, Any]] = []
		page_token: str | None = None
		while len(posts) < max_posts:
			params: dict[str, Any] = {
				"part": "snippet",
				"videoId": video_id,
				"maxResults": min(100, max_posts - len(posts)),
				"order": "relevance",
				"key": api_key,
			}
			if page_token:
				params["pageToken"] = page_token

			response = requests.get(YOUTUBE_API_URL, params=params, timeout=10)
			response.raise_for_status()
			result = response.json()
			for item in result.get("items", []):
				comment = item.get("snippet", {}).get("topLevelComment", {})
				snippet = comment.get("snippet", {})
				posts.append({
					"id": comment.get("id"),
					"text": snippet.get("textDisplay", ""),
					"author": snippet.get("authorDisplayName"),
					"timestamp": snippet.get("publishedAt"),
					"source": "youtube",
				})
				if len(posts) >= max_posts:
					break

			page_token = result.get("nextPageToken")
			if not page_token or not result.get("items"):
				break

		return posts
	except (KeyError, TypeError, ValueError, requests.RequestException) as error:
		logger.exception("Failed to fetch YouTube comments: %s", error)
		return []