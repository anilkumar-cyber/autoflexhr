"""Analytics dashboard API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from collections import Counter
from app.database.models import Candidate, get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def dashboard_metrics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    candidates = db.query(Candidate).all()
    today = str(date.today())

    statuses = [c.interview_status or "New" for c in candidates]
    status_counts = Counter(statuses)
    ats_scores = [c.ats_score for c in candidates if c.ats_score]
    avg_ats = round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 0

    # ATS distribution
    ranges = [("90-100",90,100),("80-89",80,89),("70-79",70,79),("60-69",60,69),("<60",0,59)]
    ats_dist = [{"range": r, "count": sum(1 for s in ats_scores if lo <= s <= hi)} for r, lo, hi in ranges]

    # Role distribution
    roles = Counter(c.job_title.split("(")[0].strip() for c in candidates if c.job_title)
    role_dist = [{"role": r, "count": n} for r, n in roles.most_common(10)]

    # Skills
    all_skills = []
    for c in candidates:
        if c.skills:
            all_skills.extend([s.strip() for s in c.skills.split(",") if s.strip()])
    skill_counts = Counter(all_skills)
    top_skills = [{"skill": s, "count": n} for s, n in skill_counts.most_common(12)]

    # Cities
    cities = Counter(c.city for c in candidates if c.city)
    city_dist = [{"city": c, "count": n} for c, n in cities.most_common(8)]

    # Pipeline
    pipeline = [{"status": s, "count": status_counts.get(s, 0)} for s in ["New","Screening","Shortlisted","Interview Scheduled","Offer Extended","Rejected","On Hold"]]

    return {
        "total_candidates": len(candidates),
        "today_applications": sum(1 for c in candidates if c.applied_date == today),
        "shortlisted": status_counts.get("Shortlisted", 0) + status_counts.get("Interview Scheduled", 0),
        "rejected": status_counts.get("Rejected", 0),
        "interviews_scheduled": status_counts.get("Interview Scheduled", 0),
        "avg_ats_score": avg_ats,
        "offer_extended": status_counts.get("Offer Extended", 0),
        "pipeline_data": pipeline,
        "role_distribution": role_dist,
        "ats_distribution": ats_dist,
        "top_skills": top_skills,
        "city_distribution": city_dist,
    }
