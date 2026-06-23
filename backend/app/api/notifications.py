"""Notification API routes. Read-only fetch -- creation happens as a side
effect of other actions (job posted, referral stage changed, etc.)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database.models import Notification, get_db
from app.schemas.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    role: Optional[str] = None,
    email: Optional[str] = None,
    limit: int = 30,
    db: Session = Depends(get_db),
):
    scopes = [s for s in (role, email) if s]
    if not scopes:
        return []
    return (
        db.query(Notification)
        .filter(or_(*[Notification.recipient_scope == s for s in scopes]))
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
