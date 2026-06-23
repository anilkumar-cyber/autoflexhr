"""Job postings API routes. Browsing is open to any logged-in role (employees
need to see open positions); creating/editing/deleting stays Admin-only."""
import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.models import Job, get_db, log_activity, notify
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse
from app.core.security import require_admin, get_actor_name

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _html_to_text(html: Optional[str]) -> str:
    """Strip tags so rich-text sections can still feed the plain-text
    skill-matching algorithm (compute_match) and search/filtering."""
    if not html:
        return ""
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def _sync_plain_text_fields(data: dict, job: Job):
    """Recompute description/requirements from the rich-text sections
    whenever any of them changes, so matching/search stay accurate."""
    about = data.get("about_role", job.about_role)
    primary = data.get("primary_skills", job.primary_skills)
    secondary = data.get("secondary_skills", job.secondary_skills)
    quals = data.get("qualifications_experience", job.qualifications_experience)

    if any(k in data for k in ("about_role", "primary_skills", "secondary_skills", "qualifications_experience")):
        data["description"] = _html_to_text(about)
        data["requirements"] = ", ".join(filter(None, [
            _html_to_text(primary), _html_to_text(secondary), _html_to_text(quals),
        ]))


@router.get("/", response_model=List[JobResponse])
async def get_jobs(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Job)
    if status:
        q = q.filter(Job.status == status)
    return q.order_by(Job.created_at.desc()).all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/", response_model=JobResponse, dependencies=[Depends(require_admin)])
async def create_job(payload: JobCreate, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    data = payload.model_dump(exclude_unset=True)
    _sync_plain_text_fields(data, Job())
    job = Job(**data)
    db.add(job)
    db.commit()
    db.refresh(job)
    log_activity(db, actor, "created", "job", job.id, f"Created job posting \"{job.title}\"")
    if job.status == "Open":
        notify(db, "Employee", "New job posting open", f"\"{job.title}\" is now open -- refer a great candidate!", link="/employee/positions", type="job")
    return job


@router.put("/{job_id}", response_model=JobResponse, dependencies=[Depends(require_admin)])
async def update_job(job_id: int, update: JobUpdate, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    data = update.model_dump(exclude_unset=True)
    status_changed = "status" in data and data["status"] != job.status
    old_status = job.status
    _sync_plain_text_fields(data, job)

    for k, v in data.items():
        setattr(job, k, v)

    if status_changed and job.status == "Closed":
        job.closed_at = datetime.utcnow()
    elif status_changed and job.status == "Open":
        job.closed_at = None

    db.commit()
    db.refresh(job)

    if status_changed:
        log_activity(db, actor, "status_change", "job", job.id, f"\"{job.title}\": {old_status} -> {job.status}")
        if job.status == "Open":
            notify(db, "Employee", "New job posting open", f"\"{job.title}\" is now open -- refer a great candidate!", link="/employee/positions", type="job")
        elif job.status == "Closed":
            notify(db, "Employee", "Job posting closed", f"\"{job.title}\" is no longer accepting referrals.", link="/employee/positions", type="job")
    else:
        log_activity(db, actor, "updated", "job", job.id, f"Updated job posting \"{job.title}\"")

    return job


@router.delete("/{job_id}", dependencies=[Depends(require_admin)])
async def delete_job(job_id: int, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    title = job.title
    db.delete(job)
    db.commit()
    log_activity(db, actor, "deleted", "job", job_id, f"Deleted job posting \"{title}\"")
    return {"message": "Job deleted"}
