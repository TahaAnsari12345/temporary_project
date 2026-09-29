"""Collect and normalize social media posts from supported platforms."""

import logging
import os
from typing import Any
from urllib.parse import parse_qs, urlparse

import requests


logger = logging.getLogger(__name__)

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/commentThreads"

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