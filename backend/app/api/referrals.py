"""Employee referral API routes."""
import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database.models import Candidate, Job, Referral, RewardRule, get_db, log_activity, notify
from app.schemas.schemas import ReferralResponse, ReferralStageUpdate, ReferralRewardUpdate, MatchResult
from app.core.security import require_admin, get_actor_name
from app.services.matching import compute_match
from app.ai.ai_service import parse_resume_text

router = APIRouter(prefix="/referrals", tags=["Referrals"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "resumes")


def _save_resume(resume: Optional[UploadFile]) -> Optional[str]:
    if not resume or not resume.filename:
        return None
    ext = os.path.splitext(resume.filename)[1] or ".pdf"
    fname = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(resume.file.read())
    return f"/uploads/resumes/{fname}"


def _extract_pdf_text(resume: Optional[UploadFile]) -> str:
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


@router.post("/", response_model=ReferralResponse)
async def create_referral(
    employee_name: str = Form(...),
    employee_email: str = Form(...),
    job_id: int = Form(...),
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    candidate_phone: Optional[str] = Form(None),
    candidate_skills: Optional[str] = Form(None),
    candidate_experience: Optional[str] = Form(None),
    candidate_education: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(Candidate).filter(
        Candidate.email.ilike(candidate_email),
        Candidate.is_deleted == False,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="A candidate with this email already exists.")

    resume_url = _save_resume(resume)
    skills_text = candidate_skills or ""
    if not skills_text and resume:
        skills_text = _extract_pdf_text(resume)

    match = compute_match(job.requirements, job.description, skills_text)

    candidate = Candidate(
        name=candidate_name,
        email=candidate_email,
        phone=candidate_phone,
        education=candidate_education,
        job_title=job.title,
        job_history=candidate_experience,
        skills=candidate_skills,
        ats_score=match["match_score"],
        interview_status="New",
        resume_url=resume_url,
        applied_date=datetime.utcnow().strftime("%Y-%m-%d"),
        referred_by_name=employee_name,
        referred_by_email=employee_email,
    )
    db.add(candidate)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A candidate with this email already exists.")
    db.refresh(candidate)

    referral = Referral(
        employee_name=employee_name,
        employee_email=employee_email,
        candidate_id=candidate.id,
        job_id=job.id,
        candidate_name=candidate_name,
        job_title=job.title,
        linkedin_url=linkedin_url,
        note=note,
        match_score=match["match_score"],
        stage="Referred",
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    log_activity(db, employee_name, "referred", "candidate", candidate.id, f"Referred \"{candidate_name}\" for \"{job.title}\"")
    notify(db, "Admin", "New referral submitted", f"{employee_name} referred \"{candidate_name}\" for \"{job.title}\"", link="/candidates", type="referral")
    return referral


@router.post("/qr-refer")
async def qr_refer(
    employee_name: str = Form(...),
    employee_email: str = Form(...),
    job_id: int = Form(...),
    resume: UploadFile = File(...),
    note: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Public endpoint: candidate scans employee QR, uploads resume, system parses it."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume_text = _extract_pdf_text(resume)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from resume. Please upload a valid PDF.")

    parsed = await parse_resume_text(resume_text)

    resume_url = _save_resume(resume)

    candidate_name = parsed.get("name") or "Unknown Candidate"
    candidate_email = parsed.get("email") or ""
    candidate_skills = parsed.get("skills") or ""

    if candidate_email:
        existing = db.query(Candidate).filter(
            Candidate.email.ilike(candidate_email),
            Candidate.is_deleted == False,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="A candidate with this email already exists.")

    match = compute_match(job.requirements, job.description, candidate_skills or resume_text)

    candidate = Candidate(
        name=candidate_name,
        email=candidate_email,
        phone=parsed.get("phone") or "",
        city=parsed.get("city") or "",
        education=parsed.get("education") or "",
        job_title=job.title,
        job_history=parsed.get("experience") or "",
        skills=candidate_skills,
        ats_score=match["match_score"],
        interview_status="New",
        resume_url=resume_url,
        applied_date=datetime.utcnow().strftime("%Y-%m-%d"),
        referred_by_name=employee_name,
        referred_by_email=employee_email,
    )
    db.add(candidate)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A candidate with this email already exists.")
    db.refresh(candidate)

    referral = Referral(
        employee_name=employee_name,
        employee_email=employee_email,
        candidate_id=candidate.id,
        job_id=job.id,
        candidate_name=candidate_name,
        job_title=job.title,
        note=note or "QR referral - auto-parsed from resume",
        match_score=match["match_score"],
        stage="Referred",
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    log_activity(db, employee_name, "qr_referred", "candidate", candidate.id,
                 f"QR referral: \"{candidate_name}\" for \"{job.title}\"")
    notify(db, "Admin", "New QR referral submitted",
           f"{employee_name} referred \"{candidate_name}\" for \"{job.title}\" via QR scan",
           link="/candidates", type="referral")

    return {
        "referral_id": referral.id,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "job_title": job.title,
        "match_score": match["match_score"],
        "parsed_data": parsed,
    }


@router.get("/mine", response_model=List[ReferralResponse])
async def get_my_referrals(employee_email: str, db: Session = Depends(get_db)):
    return (
        db.query(Referral)
        .filter(Referral.employee_email == employee_email)
        .order_by(Referral.created_at.desc())
        .all()
    )


@router.get("/{referral_id}", response_model=ReferralResponse)
async def get_referral(referral_id: int, db: Session = Depends(get_db)):
    ref = db.query(Referral).filter(Referral.id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")
    return ref


@router.put("/{referral_id}/stage", response_model=ReferralResponse, dependencies=[Depends(require_admin)])
async def update_referral_stage(referral_id: int, update: ReferralStageUpdate, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    ref = db.query(Referral).filter(Referral.id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")

    old_stage = ref.stage
    ref.stage = update.stage

    rule = db.query(RewardRule).filter(RewardRule.stage == update.stage, RewardRule.active == True).first()
    if rule and ref.reward_status != "Paid":
        ref.reward_amount = rule.amount
        ref.reward_status = "Pending"

    db.commit()
    db.refresh(ref)
    log_activity(db, actor, "status_change", "referral", ref.id, f"\"{ref.candidate_name}\": {old_stage} -> {ref.stage}")
    notify(db, ref.employee_email, f"Referral update: {ref.candidate_name}", f"Now at stage \"{ref.stage}\" for \"{ref.job_title}\"", link="/employee/my-referrals", type="referral")
    return ref


@router.put("/{referral_id}/reward", response_model=ReferralResponse, dependencies=[Depends(require_admin)])
async def update_referral_reward(referral_id: int, update: ReferralRewardUpdate, db: Session = Depends(get_db), actor: str = Depends(get_actor_name)):
    ref = db.query(Referral).filter(Referral.id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")

    ref.reward_status = update.reward_status
    if update.reward_status == "Paid":
        ref.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(ref)
    log_activity(db, actor, "reward_update", "referral", ref.id, f"\"{ref.candidate_name}\": reward marked {update.reward_status}")
    if update.reward_status == "Paid":
        notify(db, ref.employee_email, "Reward paid!", f"Your ${ref.reward_amount} reward for referring {ref.candidate_name} has been paid out.", link="/employee/wallet", type="reward")
    return ref


@router.get("/leaderboard/top")
async def get_leaderboard(period: str = "month", db: Session = Depends(get_db)):
    q = db.query(Referral)
    if period == "month":
        cutoff = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        q = q.filter(Referral.created_at >= cutoff)

    rows = q.all()
    by_employee = {}
    for r in rows:
        e = by_employee.setdefault(r.employee_email, {
            "employee_name": r.employee_name,
            "employee_email": r.employee_email,
            "total_referrals": 0,
            "successful_referrals": 0,
            "total_reward": 0,
        })
        e["total_referrals"] += 1
        if r.stage == "Joined":
            e["successful_referrals"] += 1
        if r.reward_status in ("Pending", "Paid"):
            e["total_reward"] += r.reward_amount or 0

    leaderboard = sorted(by_employee.values(), key=lambda e: (-e["successful_referrals"], -e["total_referrals"]))
    for i, e in enumerate(leaderboard):
        e["rank"] = i + 1
        badges = []
        if e["total_referrals"] >= 1:
            badges.append("First Referral")
        if e["total_referrals"] >= 5:
            badges.append("5 Referrals")
        if e["total_referrals"] >= 10:
            badges.append("10 Referrals")
        if e["successful_referrals"] >= 1:
            badges.append("First Hire")
        if e["rank"] == 1 and e["total_referrals"] > 0:
            badges.append("Top Referrer")
        e["badges"] = badges

    return leaderboard


@router.get("/stats/summary")
async def get_employee_stats(employee_email: str, db: Session = Depends(get_db)):
    referrals = db.query(Referral).filter(Referral.employee_email == employee_email).all()
    total = len(referrals)
    successful = sum(1 for r in referrals if r.stage == "Joined")
    pending = sum(1 for r in referrals if r.stage not in ("Joined", "Rejected"))
    rewards_earned = sum(r.reward_amount or 0 for r in referrals if r.reward_status == "Paid")
    rewards_pending = sum(r.reward_amount or 0 for r in referrals if r.reward_status == "Pending")
    open_jobs_count = db.query(Job).filter(Job.status == "Open").count()

    leaderboard = await get_leaderboard("all", db)
    rank = next((e["rank"] for e in leaderboard if e["employee_email"] == employee_email), None)

    recent = (
        db.query(Referral)
        .filter(Referral.employee_email == employee_email)
        .order_by(Referral.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_referrals": total,
        "successful_referrals": successful,
        "pending_referrals": pending,
        "rewards_earned": rewards_earned,
        "rewards_pending": rewards_pending,
        "rank": rank,
        "open_jobs_count": open_jobs_count,
        "recent_referrals": [ReferralResponse.model_validate(r) for r in recent],
    }


@router.post("/ai-match", response_model=MatchResult)
async def ai_match(
    job_id: int = Form(...),
    skills: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    skills_text = skills or ""
    if not skills_text and resume:
        skills_text = _extract_pdf_text(resume)
    if not skills_text:
        raise HTTPException(status_code=400, detail="Provide candidate skills or a resume")

    result = compute_match(job.requirements, job.description, skills_text)
    return result
