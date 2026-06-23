"""JWT Authentication utilities"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    return payload

async def require_admin(x_user_role: Optional[str] = Header(default=None)):
    """The app's frontend auth is local-only (no JWT issued for these calls yet),
    so this trusts the X-User-Role header the client sends. It blocks accidental
    non-admin access but is not a substitute for real auth once login is wired
    to the backend's JWT flow."""
    if x_user_role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return x_user_role

async def get_actor_name(x_user_name: Optional[str] = Header(default=None)) -> str:
    """Best-effort identity for activity logging, same caveat as require_admin --
    trusts a client-sent header since there's no real session yet."""
    return x_user_name or "Unknown"
