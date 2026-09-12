"""Endpoints for collecting posts for analysis."""

import logging
from datetime import datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.post import Post
from services.collector import fetch_bluesky_posts, fetch_youtube_comments
from utils.db import get_db


logger = logging.getLogger(__name__)
router = APIRouter()


class CollectRequest(BaseModel):
    platform: Literal["youtube", "bluesky"]
    url: str
    max_posts: int = 200


@router.post("/collect")
def collect_posts(request: CollectRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    analysis_id = str(uuid4())
    posts = (
        fetch_youtube_comments(request.url, request.max_posts)
        if request.platform == "youtube"
        else fetch_bluesky_posts(request.url, request.max_posts)
    )
    db_posts: list[Post] = []
    sample: list[dict[str, object]] = []

    for post in posts:
        timestamp = post.get("timestamp")
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        db_post = Post(
            id=str(uuid4()),
            analysis_id=analysis_id,
            source=post.get("source", request.platform),
            author=post.get("author"),
            text=post.get("text", ""),
            timestamp=timestamp,
        )
        db_posts.append(db_post)
        if len(sample) < 3:
            sample.append({
                "id": db_post.id,
                "analysis_id": db_post.analysis_id,
                "source": db_post.source,
                "author": db_post.author,
                "text": db_post.text,
                "timestamp": db_post.timestamp.isoformat() if db_post.timestamp else None,
            })

    try:
        db.add_all(db_posts)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to persist collected posts for %s", analysis_id)
        raise

    return {"analysis_id": analysis_id, "count": len(db_posts), "sample": sample}