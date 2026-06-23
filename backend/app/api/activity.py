"""Activity log API routes (Admin only)"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.models import ActivityLog, get_db
from app.schemas.schemas import ActivityLogResponse
from app.core.security import require_admin

router = APIRouter(prefix="/activity", tags=["Activity"], dependencies=[Depends(require_admin)])


@router.get("/", response_model=List[ActivityLogResponse])
async def get_activity(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(ActivityLog)
    if entity_type:
        q = q.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        q = q.filter(ActivityLog.entity_id == entity_id)
    return q.order_by(ActivityLog.created_at.desc()).limit(limit).all()
