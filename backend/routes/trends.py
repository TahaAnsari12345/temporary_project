"""Endpoints for topic sizes and trend summaries."""

import re
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.post import Post
from models.user import User
from utils.auth import get_current_user
from utils.db import get_db


router = APIRouter()
WORD_PATTERN = re.compile(r"[A-Za-z][A-Za-z'-]{2,}")
STOP_WORDS = {
	"about", "after", "again", "also", "because", "been", "being", "between", "could",
	"from", "have", "into", "more", "most", "other", "over", "said", "some", "than",
	"that", "their", "there", "these", "they", "this", "those", "through", "what", "when",
	"where", "which", "while", "with", "would", "your",
}


def _terms(text: str) -> list[str]:
	return [word.lower() for word in WORD_PATTERN.findall(text) if word.lower() not in STOP_WORDS]


def _trend_rows(posts: list[Post]) -> list[dict[str, object]]:
	with_dates = [post for post in posts if isinstance(post.timestamp, datetime)]
	if len(with_dates) < 2:
		return []

	ordered = sorted(with_dates, key=lambda post: post.timestamp)
	first_half = ordered[: len(ordered) // 2]
	second_half = ordered[len(ordered) // 2 :]
	old_counts = Counter(term for post in first_half for term in _terms(post.clean_text or ""))
	new_counts = Counter(term for post in second_half for term in _terms(post.clean_text or ""))
	rows: list[dict[str, object]] = []
	for label, new_size in new_counts.most_common():
		old_size = old_counts.get(label, 0)
		if not old_size or new_size == old_size:
			continue
		growth = round(abs((new_size - old_size) / old_size) * 100)
		rows.append({
			"label": label,
			"growth": growth,
			"direction": "up" if new_size > old_size else "down",
		})
	return sorted(rows, key=lambda row: row["growth"], reverse=True)[:8]


@router.get("/trends/{analysis_id}")
def get_analysis_trends(
	analysis_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> dict[str, object]:
	posts = (
		db.query(Post)
		.filter(Post.analysis_id == analysis_id, Post.user_id == current_user.id, Post.filtered.is_(False))
		.all()
	)
	term_counts = Counter(term for post in posts for term in _terms(post.clean_text or ""))
	return {
		"analysis_id": analysis_id,
		"topics": [{"label": label, "size": size} for label, size in term_counts.most_common(20)],
		"trending_topics": _trend_rows(posts),
		"note": "Insufficient time spread for trend comparison." if len({post.timestamp.date() for post in posts if isinstance(post.timestamp, datetime)}) < 2 else None,
	}