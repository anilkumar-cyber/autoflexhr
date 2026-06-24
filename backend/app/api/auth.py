"""Authentication API routes"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.models import User, get_db
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.core.security import verify_password, get_password_hash, create_access_token, limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role, "name": user.name})
    return {"access_token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Self-registration can only create Employee/Recruiter accounts -- Admin
    # accounts are created by an existing Admin via /users (Settings > Recruiters).
    if req.role not in ("Employee", "Recruiter"):
        raise HTTPException(status_code=403, detail="Self-registration is limited to Employee or Recruiter accounts")
    user = User(
        name=req.name,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role, "name": user.name})
    return {"access_token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}
