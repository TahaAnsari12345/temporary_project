"""Endpoints for listing a user's analysis runs."""

import json
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.post import Post
from models.user import User
from utils.auth import get_current_user
from utils.db import get_db


router = APIRouter()


def _read_emotion_label(emotion: object) -> str | None:
	if isinstance(emotion, str):
		try:
			emotion = json.loads(emotion)
		except json.JSONDecodeError:
			return None
	if isinstance(emotion, dict) and emotion.get("label"):
		return str(emotion["label"]).lower()
	return None


@router.get("/analyses")
def list_analyses(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> list[dict[str, object]]:
	posts = (
		db.query(Post)
		.filter(Post.user_id == current_user.id)
		.order_by(Post.created_at.desc())
		.all()
	)
	grouped: dict[str, list[Post]] = defaultdict(list)
	for post in posts:
		grouped[post.analysis_id].append(post)

	results: list[dict[str, object]] = []
	for analysis_id, analysis_posts in grouped.items():
		run_at = min(
			(post.timestamp or post.created_at for post in analysis_posts),
			default=None,
		)
		emotions: list[str] = []
		for post in analysis_posts:
			label = _read_emotion_label(post.emotion)
			if label:
				emotions.append(label)

		dominant_emotion = Counter(emotions).most_common(1)[0][0] if emotions else None
		results.append({
			"analysis_id": analysis_id,
			"run_at": run_at,
			"total_posts": len(analysis_posts),
			"dominant_emotion": dominant_emotion,
		})

	return sorted(results, key=lambda item: item["run_at"] or "", reverse=True)


@router.get("/analyses/{analysis_id}/summary")
def analysis_summary(
	analysis_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> dict[str, object]:
	posts = (
		db.query(Post)
		.filter(Post.analysis_id == analysis_id, Post.user_id == current_user.id, Post.filtered.is_(False))
		.all()
	)
	emotion_breakdown: Counter[str] = Counter()
	for post in posts:
		label = _read_emotion_label(post.emotion)
		if label:
			emotion_breakdown[label] += 1

	return {
		"analysis_id": analysis_id,
		"total_posts": len(posts),
		"emotion_breakdown": dict(emotion_breakdown),
	}


@router.get("/analyses/{analysis_id}/sample-posts")
def analysis_sample_posts(
	analysis_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> list[dict[str, object]]:
	posts = (
		db.query(Post)
		.filter(Post.analysis_id == analysis_id, Post.user_id == current_user.id, Post.filtered.is_(False))
		.order_by(Post.created_at.desc())
		.limit(15)
		.all()
	)
	return [
		{
			"id": post.id,
			"clean_text": post.clean_text or post.text,
			"emotion": post.emotion,
		}
		for post in posts
	]