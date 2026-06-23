"""Candidates API routes (PostgreSQL only)"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.models import Candidate, get_db, log_activity
from app.schemas.schemas import CandidateCreate, CandidateUpdate, CandidateResponse
from app.core.security import require_admin, get_actor_name

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("/trash", response_model=List[CandidateResponse])
async def get_trash(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return (
        db.query(Candidate)
        .filter(Candidate.is_deleted == True)
        .order_by(Candidate.deleted_at.desc())
        .all()
    )


@router.get("/", response_model=List[CandidateResponse])
async def get_candidates(
    search: Optional[str] = None,
    status: Optional[str] = None,
    job_title: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Candidate).filter(Candidate.is_deleted == False)
    if search:
        q = q.filter(
            Candidate.name.ilike(f"%{search}%")
            | Candidate.email.ilike(f"%{search}%")
            | Candidate.skills.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Candidate.interview_status == status)
    if job_title:
        q = q.filter(Candidate.job_title.ilike(f"%{job_title}%"))
    return q.order_by(Candidate.created_at.desc()).all()


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return c


@router.post("/", response_model=CandidateResponse)
async def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    if payload.email:
        existing = db.query(Candidate).filter(
            Candidate.email.ilike(payload.email),
            Candidate.is_deleted == False,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="A candidate with this email already exists.")
    c = Candidate(**payload.model_dump(exclude_unset=True))
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.post("/bulk", response_model=List[CandidateResponse])
async def bulk_create_candidates(payload: List[CandidateCreate], db: Session = Depends(get_db)):
    created = []
    for item in payload:
        c = Candidate(**item.model_dump(exclude_unset=True))
        db.add(c)
        created.append(c)
    db.commit()
    for c in created:
        db.refresh(c)
    return created


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(candidate_id: int, update: CandidateUpdate, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    data = update.model_dump(exclude_unset=True)
    old_status = c.interview_status
    status_changed = "interview_status" in data and data["interview_status"] != old_status

    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)

    if status_changed:
        log_activity(db, actor, "status_change", "candidate", c.id, f"\"{c.name}\": {old_status} -> {c.interview_status}")

    return c


@router.post("/{candidate_id}/duplicate", response_model=CandidateResponse)
async def duplicate_candidate(candidate_id: int, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    copy = Candidate(
        name=f"{c.name} (Copy)" if c.name else c.name,
        email=c.email,
        phone=c.phone,
        city=c.city,
        education=c.education,
        job_title=c.job_title,
        job_history=c.job_history,
        skills=c.skills,
        hr_evaluation=c.hr_evaluation,
        ats_score=c.ats_score,
        interview_status="New",
        interview_date=c.interview_date,
        resume_url=c.resume_url,
        applied_date=datetime.utcnow().strftime("%Y-%m-%d"),
        notes=c.notes,
        assigned_recruiter_id=c.assigned_recruiter_id,
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    log_activity(db, actor, "duplicated", "candidate", copy.id, f"Duplicated \"{c.name}\" (from #{c.id})")
    return copy


@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin), actor: str = Depends(get_actor_name)):
    """Soft delete: moves the candidate to trash so it can be restored later."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id, Candidate.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    c.is_deleted = True
    c.deleted_at = datetime.utcnow()
    db.commit()
    log_activity(db, actor, "trashed", "candidate", c.id, f"Moved \"{c.name}\" to trash")
    return {"message": "Candidate moved to trash"}


@router.post("/{candidate_id}/restore", response_model=CandidateResponse)
async def restore_candidate(candidate_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin), actor: str = Depends(get_actor_name)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id, Candidate.is_deleted == True).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found in trash")
    c.is_deleted = False
    c.deleted_at = None
    db.commit()
    db.refresh(c)
    log_activity(db, actor, "restored", "candidate", c.id, f"Restored \"{c.name}\" from trash")
    return c


@router.delete("/{candidate_id}/permanent")
async def permanently_delete_candidate(candidate_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin), actor: str = Depends(get_actor_name)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    name = c.name
    db.delete(c)
    db.commit()
    log_activity(db, actor, "permanently_deleted", "candidate", candidate_id, f"Permanently deleted \"{name}\"")
    return {"message": "Candidate permanently deleted"}
