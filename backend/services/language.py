"""Detect and manage languages found in social media posts."""

from typing import Any

from langdetect import detect_langs
from langdetect.lang_detect_exception import LangDetectException


def detect_language(text: str) -> dict[str, Any]:
	"""Detect the most likely language, marking uncertain results as mixed."""
	try:
		results = detect_langs(text)
		if not results:
			raise LangDetectException(0, "No language detected")

		top_result = results[0]
		confidence = float(top_result.prob)
		close_second = len(results) > 1 and confidence - float(results[1].prob) <= 0.15
		mixed = confidence < 0.6 or close_second

		return {
			"language": "mixed" if mixed else top_result.lang,
			"confidence": confidence,
			"mixed": mixed,
		}
	except LangDetectException:
		return {"language": "unknown", "confidence": 0.0, "mixed": False}


def detect_languages_batch(posts: list[Any]) -> None:
	"""Set language values in place for eligible SQLAlchemy Post objects."""
	for post in posts:
		if post.filtered is False and post.clean_text:
			post.language = detect_language(post.clean_text)["language"]