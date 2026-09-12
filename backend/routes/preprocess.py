"""Endpoints for cleaning collected social media posts."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.post import Post
from services.preprocess import preprocess_posts
from utils.db import get_db


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/preprocess/{analysis_id}")
def preprocess_analysis(analysis_id: str, db: Session = Depends(get_db)) -> dict[str, int | str]:
    """Clean and deduplicate raw posts for an analysis, retaining filtered records."""
    try:
        raw_posts = db.query(Post).filter(Post.analysis_id == analysis_id).all()
        raw_dicts = [
            {"id": post.id, "text": post.text}
            for post in raw_posts
        ]
        cleaned_posts = preprocess_posts(raw_dicts)
        cleaned_by_id = {post["id"]: post["clean_text"] for post in cleaned_posts}

        for post in raw_posts:
            if post.id in cleaned_by_id:
                post.clean_text = cleaned_by_id[post.id]
                post.filtered = False
            else:
                post.clean_text = ""
                post.filtered = True

        db.commit()
        cleaned_count = sum(not post.filtered for post in raw_posts)
        return {
            "analysis_id": analysis_id,
            "original_count": len(raw_posts),
            "cleaned_count": cleaned_count,
        }
    except Exception as error:
        db.rollback()
        logger.exception("Failed to preprocess posts for %s: %s", analysis_id, error)
        raise HTTPException(status_code=503, detail="Unable to preprocess posts") from error