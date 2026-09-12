"""Endpoints for detecting languages in cleaned posts."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.post import Post
from services.language import detect_languages_batch
from utils.db import get_db


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/detect-language/{analysis_id}")
def detect_analysis_languages(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Detect and persist languages for all eligible posts in an analysis."""
    try:
        posts = (
            db.query(Post)
            .filter(Post.analysis_id == analysis_id, Post.filtered.is_(False))
            .all()
        )
        detect_languages_batch(posts)
        db.commit()

        language_breakdown: dict[str, int] = {}
        for post in posts:
            if post.language:
                language_breakdown[post.language] = language_breakdown.get(post.language, 0) + 1

        return {
            "analysis_id": analysis_id,
            "language_breakdown": language_breakdown,
            "total_processed": len(posts),
        }
    except Exception as error:
        db.rollback()
        logger.exception("Failed to detect languages for %s: %s", analysis_id, error)
        raise HTTPException(status_code=503, detail="Unable to detect languages") from error