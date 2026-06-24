"""Candidates API routes (PostgreSQL only)"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.database.models import Candidate, Job, User, get_db, log_activity, notify
from app.schemas.schemas import CandidateCreate, CandidateUpdate, CandidateResponse, CandidateAssign
from app.core.security import require_admin, get_actor_name, decode_token
from app.services.matching import compute_match
from app.ai.ai_service import parse_resume_text

router = APIRouter(prefix="/candidates", tags=["Candidates"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "resumes")


def _save_resume(resume: UploadFile) -> Optional[str]:
    if not resume or not resume.filename:
        return None
    ext = os.path.splitext(resume.filename)[1] or ".pdf"
    fname = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(resume.file.read())
    return f"/uploads/resumes/{fname}"


def _extract_pdf_text(resume: UploadFile) -> str:
    if not resume or not resume.filename:
        return ""
    try:
        from pypdf import PdfReader
        resume.file.seek(0)
        reader = PdfReader(resume.file)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        resume.file.seek(0)
        return text
    except Exception:
        return ""


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
    authorization: Optional[str] = Header(None),
):
    q = db.query(Candidate).filter(Candidate.is_deleted == False)
    # Recruiters only see candidates assigned to them; Admins see everyone.
    if authorization and authorization.lower().startswith("bearer "):
        try:
            payload = decode_token(authorization.split(" ", 1)[1])
            if payload.get("role") == "Recruiter":
                q = q.filter(Candidate.assigned_recruiter_id == int(payload["sub"]))
        except HTTPException:
            pass
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
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A candidate with this email already exists.")
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


@router.post("/bulk-resumes")
async def bulk_import_resumes(
    resumes: List[UploadFile] = File(...),
    job_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    actor: str = Depends(get_actor_name),
):
    """Admin-only: parse multiple resume PDFs with AI and create a candidate
    for each. If job_id is given, ATS score is computed against that job's
    requirements; otherwise it falls back to the AI's own resume-quality score."""
    job = db.query(Job).filter(Job.id == job_id).first() if job_id else None

    created = []
    skipped = []
    for resume in resumes:
        text = _extract_pdf_text(resume)
        if not text.strip():
            skipped.append({"filename": resume.filename, "reason": "Could not extract text from PDF"})
            continue

        parsed = await parse_resume_text(text)
        email = parsed.get("email") or ""

        if email:
            existing = db.query(Candidate).filter(
                Candidate.email.ilike(email),
                Candidate.is_deleted == False,
            ).first()
            if existing:
                skipped.append({"filename": resume.filename, "reason": f"Candidate with email {email} already exists"})
                continue

        if job:
            match = compute_match(job.requirements, job.description, parsed.get("skills") or text)
            ats_score = match["match_score"]
        else:
            ats_score = parsed.get("ats_score") or 0

        c = Candidate(
            name=parsed.get("name") or resume.filename,
            email=email,
            phone=parsed.get("phone") or "",
            city=parsed.get("city") or "",
            education=parsed.get("education") or "",
            job_title=job.title if job else "",
            job_history=parsed.get("experience") or None,
            skills=parsed.get("skills") or "",
            ats_score=ats_score,
            interview_status="New",
            resume_url=_save_resume(resume),
            applied_date=datetime.utcnow().strftime("%Y-%m-%d"),
        )
        db.add(c)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            skipped.append({"filename": resume.filename, "reason": f"Candidate with email {email} already exists"})
            continue
        db.refresh(c)
        created.append(c)

    if created:
        log_activity(
            db, actor, "bulk_imported", "candidate", created[0].id,
            f"Bulk imported {len(created)} resume(s)" + (f" for \"{job.title}\"" if job else ""),
        )

    return {
        "created": [CandidateResponse.model_validate(c) for c in created],
        "skipped": skipped,
    }


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


@router.put("/{candidate_id}/assign", response_model=CandidateResponse)
async def assign_candidate(candidate_id: int, payload: CandidateAssign, db: Session = Depends(get_db), _admin=Depends(require_admin), actor: str = Depends(get_actor_name)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id, Candidate.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if payload.assigned_recruiter_id is not None:
        recruiter = db.query(User).filter(User.id == payload.assigned_recruiter_id, User.role == "Recruiter").first()
        if not recruiter:
            raise HTTPException(status_code=404, detail="Recruiter not found")
        c.assigned_recruiter_id = recruiter.id
        db.commit()
        db.refresh(c)
        log_activity(db, actor, "assigned", "candidate", c.id, f"Assigned \"{c.name}\" to {recruiter.name}")
        notify(db, recruiter.email, "Candidate assigned to you", f"\"{c.name}\" has been assigned to you for recruitment.", link="/candidates", type="system")
    else:
        c.assigned_recruiter_id = None
        db.commit()
        db.refresh(c)
        log_activity(db, actor, "unassigned", "candidate", c.id, f"Unassigned \"{c.name}\" from recruiter")

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
