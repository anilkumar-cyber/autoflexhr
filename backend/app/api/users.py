"""User management API routes (Admin only) -- create recruiter/admin accounts."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.models import User, get_db
from app.schemas.schemas import UserCreate, UserResponse
from app.core.security import require_admin, get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
async def list_users(role: Optional[str] = None, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.created_at.desc()).all()


@router.post("/", response_model=UserResponse)
async def create_user(payload: UserCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
