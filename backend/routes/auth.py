"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.user import User
from utils.auth import create_access_token, get_current_user, hash_password, verify_password
from utils.db import get_db


router = APIRouter(prefix="/auth")


class SignupRequest(BaseModel):
	email: str
	password: str
	name: str | None = None


def _user_response(user: User) -> dict[str, object]:
	return {"id": user.id, "email": user.email, "name": user.name}


def _auth_response(user: User) -> dict[str, object]:
	return {
		"access_token": create_access_token({"sub": user.id}),
		"token_type": "bearer",
		"user": _user_response(user),
	}


@router.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)) -> dict[str, object]:
	email = request.email.strip().lower()
	if db.query(User).filter(User.email == email).first():
		raise HTTPException(status_code=400, detail="Email is already registered")

	user = User(email=email, hashed_password=hash_password(request.password), name=request.name)
	db.add(user)
	db.commit()
	db.refresh(user)
	return _auth_response(user)


@router.post("/login")
def login(
	form_data: OAuth2PasswordRequestForm = Depends(),
	db: Session = Depends(get_db),
) -> dict[str, object]:
	email = form_data.username.strip().lower()
	user = db.query(User).filter(User.email == email).first()
	if user is None or not verify_password(form_data.password, user.hashed_password):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Incorrect email or password",
			headers={"WWW-Authenticate": "Bearer"},
		)
	return _auth_response(user)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> dict[str, object]:
	return _user_response(current_user)