"""
app/api/routes/users.py
───────────────────────
User management (Admin only).
GET  /api/users
POST /api/users
PUT  /api/users/{id}
DELETE /api/users/{id}
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[UserOut], summary="List all users (Admin)")
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Create user (Admin)")
def create_user(payload: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut, summary="Update user (Admin)")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = payload.model_dump(exclude_none=True)
    if "password" in updates:
        updates["hashed_password"] = hash_password(updates.pop("password"))
    for k, v in updates.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user (Admin)")
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()

