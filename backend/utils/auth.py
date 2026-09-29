"""Authentication helpers and FastAPI dependencies."""

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from models.user import User
from utils.db import get_db


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-only-change-this-secret")
ALGORITHM = "HS256"
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(plain: str) -> str:
	return password_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
	return password_context.verify(plain, hashed)


def create_access_token(data: dict, expires_minutes: int = 1440) -> str:
	payload = data.copy()
	payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
	return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
	token: str = Depends(oauth2_scheme),
	db: Session = Depends(get_db),
) -> User:
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		user_id = payload.get("sub")
		if not isinstance(user_id, str):
			raise credentials_exception
	except JWTError as error:
		raise credentials_exception from error

	user = db.query(User).filter(User.id == user_id).first()
	if user is None:
		raise credentials_exception
	return user