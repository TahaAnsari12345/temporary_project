"""Clean and normalize social media text for analysis."""

import re
from typing import Any


URL_PATTERN = re.compile(r"https?://[^\s<]+", re.IGNORECASE)
HTML_TAG_PATTERN = re.compile(r"<[^>]*>")
MENTION_PATTERN = re.compile(r"(?<!\w)@[\w.-]+")
REPEATED_SYMBOL_PATTERN = re.compile(r"([!?.,*_~=+\-])\1{3,}")
WHITESPACE_PATTERN = re.compile(r"\s+")


def clean_text(text: str) -> str:
	"""Remove links, markup, spam patterns, and insignificant whitespace."""
	if not isinstance(text, str):
		return ""

	cleaned = URL_PATTERN.sub(" ", text)
	cleaned = HTML_TAG_PATTERN.sub(" ", cleaned)
	cleaned = REPEATED_SYMBOL_PATTERN.sub(" ", cleaned)
	mention_free = MENTION_PATTERN.sub(" ", cleaned)
	if not mention_free.strip() and MENTION_PATTERN.search(cleaned):
		cleaned = ""
	cleaned = WHITESPACE_PATTERN.sub(" ", cleaned).strip()

	if len(cleaned) < 3:
		return ""
	return cleaned


def preprocess_posts(posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
	"""Add cleaned text to posts and remove empty or exact duplicate content."""
	processed: list[dict[str, Any]] = []
	seen_text: set[str] = set()

	for post in posts:
		cleaned = clean_text(post.get("text", ""))
		if not cleaned or cleaned in seen_text:
			continue

		seen_text.add(cleaned)
		processed.append({**post, "clean_text": cleaned})

	return processed