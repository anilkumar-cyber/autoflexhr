from sqlalchemy import (
    create_engine,
    Column,
    Index,
    Integer,
    JSON,
    String,
    Boolean,
    Float,
    DateTime,
    Text,
    ForeignKey,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB

# Real jsonb on Postgres (matches the live column type); falls back to plain
# JSON (stored as TEXT) on SQLite so the test suite can run without a Postgres
# server.
JSONType = JSON().with_variant(JSONB, "postgresql")

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
    # name/phone/city/job_title are unbounded Text in the live DB (never enforced
    # as VARCHAR(n) despite the column names suggesting otherwise) -- the model
    # matches that instead of risking a migration that fails on existing long values.
    name = Column(Text)
    email = Column(Text, index=True)
    phone = Column(Text)
    city = Column(Text)
    education = Column(Text)
    job_title = Column(Text)
    job_history = Column(JSONType)  # stores a JSON string (e.g. "5 years as...") or null
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

    __table_args__ = (
        # Created via raw SQL in create_tables() for backward compatibility with
        # existing DBs; declared here too so Alembic autogenerate recognizes it
        # instead of trying to drop it.
        Index(
            "uq_candidates_active_email",
            func.lower(email),
            unique=True,
            postgresql_where=text("is_deleted = false AND email IS NOT NULL AND email <> ''"),
            sqlite_where=text("is_deleted = 0 AND email IS NOT NULL AND email <> ''"),
        ),
    )

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
        # Application-level "does this email already exist" checks are racy under
        # concurrent requests (double form submit, webhook retry) -- two requests
        # can both pass the check before either commits, so existing duplicate
        # rows are likely already sitting in the table. Move all but the
        # earliest active row per email to trash before adding the constraint,
        # otherwise CREATE UNIQUE INDEX would fail outright on the bad data.
        conn.execute(text(
            """
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY id) AS rn
                FROM candidates
                WHERE is_deleted = false AND email IS NOT NULL AND email <> ''
            )
            UPDATE candidates
            SET is_deleted = true, deleted_at = now()
            WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
            """
        ))
        # Makes the active-candidate-per-email rule atomic at the DB level so a
        # racing second insert fails fast (IntegrityError -> 409) instead of
        # creating a duplicate row.
        conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_candidates_active_email "
            "ON candidates (lower(email)) "
            "WHERE is_deleted = false AND email IS NOT NULL AND email <> ''"
        ))
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
