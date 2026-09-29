"""SQLAlchemy model for SocialSense users."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from utils.db import Base


class User(Base):
	"""A SocialSense account."""

	__tablename__ = "users"

	id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
	email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
	hashed_password: Mapped[str] = mapped_column(String, nullable=False)
	name: Mapped[str | None] = mapped_column(String, nullable=True)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		default=lambda: datetime.now(timezone.utc),
		nullable=False,
	)