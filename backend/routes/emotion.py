"""Endpoints for detecting emotions in cleaned posts."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.post import Post
from services.emotion import detect_emotions_batch
from utils.db import get_db


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/detect-emotion/{analysis_id}")
def detect_analysis_emotions(
	analysis_id: str,
	db: Session = Depends(get_db),
) -> dict[str, object]:
	"""Detect and persist emotions for all eligible posts in an analysis."""
	try:
		posts = (
			db.query(Post)
			.filter(Post.analysis_id == analysis_id, Post.filtered.is_(False))
			.all()
		)
		detect_emotions_batch(posts)
		for post in posts:
			print(f"[emotion] post_id={post.id} emotion={post.emotion!r}")
		db.commit()

		emotion_breakdown: dict[str, int] = {}
		for post in posts:
			emotion = post.emotion
			if isinstance(emotion, str):
				try:
					emotion = json.loads(emotion)
				except json.JSONDecodeError:
					emotion = None
			if isinstance(emotion, dict):
				label = str(emotion.get("label", "unknown")).lower()
				emotion_breakdown[label] = emotion_breakdown.get(label, 0) + 1

		return {
			"analysis_id": analysis_id,
			"emotion_breakdown": emotion_breakdown,
			"total_processed": len(posts),
		}
	except Exception as error:
		db.rollback()
		logger.exception("Failed to detect emotions for %s: %s", analysis_id, error)
		raise HTTPException(status_code=503, detail="Unable to detect emotions") from error