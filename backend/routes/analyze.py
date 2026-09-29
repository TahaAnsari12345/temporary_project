"""Endpoint for running the complete SocialSense analysis pipeline."""

import json
import logging
from datetime import datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.post import Post
from models.user import User
from services.collector import fetch_youtube_comments
from services.emotion import detect_emotions_batch
from services.language import detect_languages_batch
from services.preprocess import preprocess_posts
from utils.auth import get_current_user
from utils.db import get_db


logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
	platform: Literal["youtube"]
	url: str


def _count_languages(posts: list[Post]) -> dict[str, int]:
	breakdown: dict[str, int] = {}
	for post in posts:
		if post.language:
			breakdown[post.language] = breakdown.get(post.language, 0) + 1
	return breakdown


def _count_emotions(posts: list[Post]) -> dict[str, int]:
	breakdown: dict[str, int] = {}
	for post in posts:
		emotion = post.emotion
		if isinstance(emotion, str):
			try:
				emotion = json.loads(emotion)
			except json.JSONDecodeError:
				emotion = None
		if isinstance(emotion, dict):
			label = str(emotion.get("label", "unknown")).lower()
			breakdown[label] = breakdown.get(label, 0) + 1
	return breakdown


@router.post("/analyze")
def analyze(
	request: AnalyzeRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> dict[str, object]:
	"""Collect, preprocess, enrich, and summarize one YouTube analysis."""
	analysis_id = str(uuid4())
	posts = fetch_youtube_comments(request.url)
	if not posts:
		raise HTTPException(status_code=422, detail="No YouTube comments were found for this URL")

	try:
		db_posts: list[Post] = []
		for post in posts:
			timestamp = post.get("timestamp")
			if isinstance(timestamp, str):
				timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
			db_posts.append(Post(
				id=str(uuid4()),
				analysis_id=analysis_id,
				user_id=current_user.id,
				source=post.get("source", request.platform),
				author=post.get("author"),
				text=post.get("text", ""),
				timestamp=timestamp,
			))

		db.add_all(db_posts)
		db.flush()

		raw_posts = db.query(Post).filter(Post.analysis_id == analysis_id).all()
		raw_dicts = [{"id": post.id, "text": post.text} for post in raw_posts]
		cleaned_posts = preprocess_posts(raw_dicts)
		cleaned_by_id = {post["id"]: post["clean_text"] for post in cleaned_posts}
		for post in raw_posts:
			if post.id in cleaned_by_id:
				post.clean_text = cleaned_by_id[post.id]
				post.filtered = False
			else:
				post.clean_text = ""
				post.filtered = True

		cleaned_rows = (
			db.query(Post)
			.filter(Post.analysis_id == analysis_id, Post.filtered.is_(False))
			.all()
		)
		total_cleaned = len(cleaned_rows)
		detect_languages_batch(cleaned_rows)

		emotion_rows = (
			db.query(Post)
			.filter(Post.analysis_id == analysis_id, Post.filtered.is_(False))
			.all()
		)
		detect_emotions_batch(emotion_rows)
		db.commit()

		return {
			"analysis_id": analysis_id,
			"total_collected": len(db_posts),
			"total_cleaned": total_cleaned,
			"language_breakdown": _count_languages(cleaned_rows),
			"emotion_breakdown": _count_emotions(emotion_rows),
		}
	except Exception as error:
		db.rollback()
		logger.exception("Failed to analyze posts for %s: %s", analysis_id, error)
		raise HTTPException(status_code=503, detail="Unable to complete analysis") from error