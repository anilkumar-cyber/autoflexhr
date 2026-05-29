"""Candidates API routes"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.models import Candidate, get_db
from app.schemas.schemas import CandidateCreate, CandidateUpdate, CandidateResponse
from app.core.security import get_current_user
import httpx

router = APIRouter(prefix="/candidates", tags=["Candidates"])

SHEET_ID = "1_da4wqDPxCKnJXF9O5Tq0YiHfTWS0Iy_MsQqplX4W6U"
SHEET_NAME = "Sheet1"

STATUS_MAP = {
    "shortlisted": "Shortlisted",
    "interview scheduled": "Interview Scheduled",
    "offer extended": "Offer Extended",
    "rejected": "Rejected",
    "on hold": "On Hold",
    "screening": "Screening",
    "new": "New",
}

def parse_ats(val):
    try:
        raw = float(val)
        return round(raw * 10) if 0 < raw <= 10 else round(raw)
    except:
        return 0

@router.get("/sync-sheets")
async def sync_from_sheets(api_key: str = Query(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Sync candidates from Google Sheets into database."""
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{SHEET_NAME}?key={api_key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, timeout=15)
        if not res.is_success:
            raise HTTPException(status_code=400, detail=f"Sheets API error: {res.text}")
        data = res.json()

    if not data.get("values") or len(data["values"]) < 2:
        return {"synced": 0, "message": "No data found in sheet"}

    headers, *rows = data["values"]
    synced = 0
    for row in rows:
        if not any(c.strip() for c in row):
            continue
        obj = {h: (row[i] if i < len(row) else "").strip() for i, h in enumerate(headers)}
        status_raw = obj.get("Interview Status", "").strip().lower()
        resume_url = obj.get("Resume URL", "").strip()
        if resume_url:
            resume_url = resume_url.replace("/view", "/preview")

        existing = db.query(Candidate).filter(Candidate.email == obj.get("Email", "")).first()
        candidate_data = dict(
            name=obj.get("Name", ""),
            email=obj.get("Email", ""),
            phone=obj.get("Phone", ""),
            city=obj.get("City", ""),
            education=obj.get("Educational Qualification", ""),
            job_title=obj.get("Job title", ""),
            job_history=obj.get("Job History", ""),
            skills=obj.get("Skills", ""),
            hr_evaluation=obj.get("HR Evaluation", ""),
            ats_score=parse_ats(obj.get("ATS Score", "0")),
            interview_status=STATUS_MAP.get(status_raw, obj.get("Interview Status", "New") or "New"),
            interview_date=obj.get("Interview Date", ""),
            resume_url=resume_url,
            applied_date=str(date.today()),
        )
        if existing:
            for k, v in candidate_data.items():
                setattr(existing, k, v)
        else:
            db.add(Candidate(**candidate_data))
        synced += 1

    db.commit()
    return {"synced": synced, "message": f"Successfully synced {synced} candidates"}

@router.get("/", response_model=List[CandidateResponse])
async def get_candidates(
    search: Optional[str] = None,
    status: Optional[str] = None,
    job_title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Candidate)
    if search:
        q = q.filter(Candidate.name.ilike(f"%{search}%") | Candidate.email.ilike(f"%{search}%") | Candidate.skills.ilike(f"%{search}%"))
    if status:
        q = q.filter(Candidate.interview_status == status)
    if job_title:
        q = q.filter(Candidate.job_title.ilike(f"%{job_title}%"))
    return q.order_by(Candidate.created_at.desc()).all()

@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return c

@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(candidate_id: int, update: CandidateUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(c)
    db.commit()
    return {"message": "Candidate deleted"}
