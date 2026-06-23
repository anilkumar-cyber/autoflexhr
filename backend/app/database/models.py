from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    Float,
    DateTime,
    Text,
    ForeignKey,
    text,
)

from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
from app.core.config import settings
from app.core.security import get_password_hash

DATABASE_URL = settings.DATABASE_URL

# DATABASE_URL = "postgresql+psycopg2://postgres:Zaq1xsw2%40@127.0.0.1:5432/autoflex_hr"
# DATABASE_URL = "postgresql+psycopg2://autoflexuser:Snoopy%402498@172.16.1.1:5432/autoflexhr"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# ── Models ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="Recruiter")  # Admin | Recruiter
    avatar_color = Column(String(10), default="#6366f1")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    email = Column(String(200), index=True)
    phone = Column(String(50))
    city = Column(String(100))
    education = Column(Text)
    job_title = Column(String(200))
    job_history = Column(Text)
    skills = Column(Text)
    hr_evaluation = Column(Text)
    ats_score = Column(Float, default=0)
    interview_status = Column(String(50), default="New")
    interview_date = Column(String(50))
    resume_url = Column(Text)
    applied_date = Column(String(20))
    notes = Column(Text, default="")
    assigned_recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    referred_by_name = Column(String(100), nullable=True)
    referred_by_email = Column(String(200), nullable=True)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    actor = Column(String(100), nullable=True)
    action = Column(String(200))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    department = Column(String(100))
    description = Column(Text)
    requirements = Column(Text)
    # Rich-text (HTML) sections shown on job postings. description/requirements
    # above stay populated with plain-text derivatives of these so the existing
    # AI skill-matching logic keeps working unchanged.
    about_role = Column(Text)
    primary_skills = Column(Text)
    secondary_skills = Column(Text)
    qualifications_experience = Column(Text)
    what_we_offer = Column(Text)
    status = Column(String(20), default="Open")  # Open | Closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String(100), nullable=False)
    employee_email = Column(String(200), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    candidate_name = Column(String(200))
    job_title = Column(String(200))
    linkedin_url = Column(Text, nullable=True)
    note = Column(Text, nullable=True)
    match_score = Column(Float, nullable=True)
    stage = Column(String(30), default="Referred")  # Referred|Screening|Shortlisted|Interview|Selected|Offer|Joined|Rejected
    reward_amount = Column(Float, nullable=True)
    reward_status = Column(String(20), default="None")  # None|Pending|Paid
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RewardRule(Base):
    __tablename__ = "reward_rules"
    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String(30), nullable=False, unique=True)
    amount = Column(Float, nullable=False, default=0)
    currency = Column(String(10), default="USD")
    active = Column(Boolean, default=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    # Either a role ("Employee" | "Admin" | "Recruiter") to broadcast to everyone
    # with that role, or a specific email for a targeted notification.
    recipient_scope = Column(String(200), nullable=False, index=True)
    type = Column(String(30), default="info")  # job|referral|reward|system
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    link = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
    # Base.metadata.create_all() only creates missing tables, it won't add new
    # columns to a table that already exists from before this field was added.
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.execute(text(
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP"
        ))
        conn.execute(text(
            "ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor VARCHAR(100)"
        ))
        conn.execute(text(
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS referred_by_name VARCHAR(100)"
        ))
        conn.execute(text(
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS referred_by_email VARCHAR(200)"
        ))
        for col in ("about_role", "primary_skills", "secondary_skills", "qualifications_experience", "what_we_offer"):
            conn.execute(text(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col} TEXT"))
        conn.commit()

    with SessionLocal() as db:
        if db.query(User).count() == 0:
            # Same creds the old local-only demo login used, now backed by real
            # accounts so login keeps working once routed through /auth/login.
            db.add_all([
                User(name="HR Admin", email="hr@autoflex.com", hashed_password=get_password_hash("admin123"), role="Admin"),
                User(name="Recruiter", email="recruiter@autoflex.com", hashed_password=get_password_hash("recruiter123"), role="Recruiter"),
                User(name="Employee", email="employee@autoflex.com", hashed_password=get_password_hash("employee123"), role="Employee"),
            ])
            db.commit()

        if db.query(RewardRule).count() == 0:
            # Placeholder tiers -- edit amounts via the reward_rules table once real policy is set.
            db.add_all([
                RewardRule(stage="Shortlisted", amount=25, currency="USD"),
                RewardRule(stage="Interview", amount=50, currency="USD"),
                RewardRule(stage="Joined", amount=500, currency="USD"),
            ])
            db.commit()

def log_activity(db, actor: str, action: str, entity_type: str, entity_id: int, details: str = None):
    entry = ActivityLog(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    db.commit()

def notify(db, recipient_scope: str, title: str, message: str = None, link: str = None, type: str = "info"):
    entry = Notification(
        recipient_scope=recipient_scope,
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.add(entry)
    db.commit()
