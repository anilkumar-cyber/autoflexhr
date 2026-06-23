"""Pydantic schemas for request/response validation"""
import json
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "Recruiter"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ── Candidate ─────────────────────────────────────────────────────────────────
class CandidateBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    education: Optional[str] = None
    job_title: Optional[str] = None
    job_history: Optional[str] = None
    skills: Optional[str] = None
    hr_evaluation: Optional[str] = None
    ats_score: Optional[float] = 0
    interview_status: Optional[str] = "New"
    interview_date: Optional[str] = None
    resume_url: Optional[str] = None
    applied_date: Optional[str] = None
    notes: Optional[str] = ""

    @field_validator("job_history", mode="before")
    @classmethod
    def stringify_job_history(cls, v):
        # The n8n resume-parsing workflow stores this as jsonb (structured
        # role/period/responsibilities), not plain text.
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        return v

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(CandidateBase):
    pass

class CandidateResponse(CandidateBase):
    id: int
    created_at: Optional[datetime] = None
    is_deleted: Optional[bool] = False
    deleted_at: Optional[datetime] = None
    referred_by_name: Optional[str] = None
    referred_by_email: Optional[str] = None
    class Config:
        from_attributes = True

# ── Job ───────────────────────────────────────────────────────────────────────
class JobBase(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: Optional[str] = "Open"

class JobCreate(JobBase):
    title: str

class JobUpdate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ── Activity ──────────────────────────────────────────────────────────────────
class ActivityLogResponse(BaseModel):
    id: int
    actor: Optional[str] = None
    action: str
    entity_type: str
    entity_id: int
    details: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ── Referral ──────────────────────────────────────────────────────────────────
class ReferralResponse(BaseModel):
    id: int
    employee_name: str
    employee_email: str
    candidate_id: int
    job_id: Optional[int] = None
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    linkedin_url: Optional[str] = None
    note: Optional[str] = None
    match_score: Optional[float] = None
    stage: str
    reward_amount: Optional[float] = None
    reward_status: str
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ReferralStageUpdate(BaseModel):
    stage: str

class ReferralRewardUpdate(BaseModel):
    reward_status: str

class RewardRuleResponse(BaseModel):
    id: int
    stage: str
    amount: float
    currency: str
    active: bool
    class Config:
        from_attributes = True

class MatchResult(BaseModel):
    match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    summary: str

# ── AI ────────────────────────────────────────────────────────────────────────
class AIAnalysisRequest(BaseModel):
    candidate_id: Optional[int] = None
    name: str
    job_title: str
    skills: str
    job_history: str
    education: str
    hr_evaluation: Optional[str] = ""
    ats_score: Optional[float] = 0

class FraudDetectionRequest(BaseModel):
    name: str
    job_title: str
    skills: str
    job_history: str
    education: str
    ats_score: Optional[float] = 0

# ── Analytics ─────────────────────────────────────────────────────────────────
class DashboardMetrics(BaseModel):
    total_candidates: int
    today_applications: int
    shortlisted: int
    rejected: int
    interviews_scheduled: int
    avg_ats_score: float
    offer_extended: int
    pipeline_data: List[dict]
    role_distribution: List[dict]
    ats_distribution: List[dict]
    top_skills: List[dict]
    city_distribution: List[dict]
