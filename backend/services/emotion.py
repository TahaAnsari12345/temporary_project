"""Classify emotions expressed in social media posts."""

from typing import Any

from transformers import pipeline


sentiment_pipeline = pipeline(
	"sentiment-analysis",
	model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
	tokenizer="cardiffnlp/twitter-xlm-roberta-base-sentiment",
)


def detect_emotion(text: str) -> dict[str, Any]:
	"""Detect the sentiment label and confidence for one post."""
	try:
		if not isinstance(text, str) or not text.strip():
			return {"label": "unknown", "confidence": 0.0}

		result = sentiment_pipeline(text[:512])[0]
		return {
			"label": str(result["label"]).lower(),
			"confidence": round(float(result["score"]), 3),
		}
	except Exception:
		return {"label": "unknown", "confidence": 0.0}


def detect_emotions_batch(posts: list[Any]) -> None:
	"""Set emotion values in place for eligible SQLAlchemy Post objects."""
	for post in posts:
		if post.filtered is False and post.clean_text:
			post.emotion = detect_emotion(post.clean_text)