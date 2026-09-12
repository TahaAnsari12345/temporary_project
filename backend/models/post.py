"""SQLAlchemy model for collected and analyzed social media posts."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from utils.db import Base


class Post(Base):
    """A social media post associated with an analysis run."""

    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    analysis_id: Mapped[str] = mapped_column(String, index=True)
    source: Mapped[str] = mapped_column(String)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text)
    clean_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    filtered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    language: Mapped[str | None] = mapped_column(String, nullable=True)
    emotion: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    topic_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )