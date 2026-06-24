"""Shared pytest fixtures: an isolated in-memory SQLite DB per test, with the
app's get_db dependency overridden so no real Postgres connection is needed."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.models import Base, User, get_db
from app.core.security import get_password_hash, limiter
from app.main import app

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def fresh_db():
    """Recreate all tables before every test so tests don't see each other's data."""
    Base.metadata.create_all(bind=test_engine)
    limiter.reset()  # /auth/login + /auth/register are rate-limited -- don't let it bleed across tests
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_user(db_session):
    user = User(name="HR Admin", email="admin@test.com", hashed_password=get_password_hash("password123"), role="Admin")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def recruiter_user(db_session):
    user = User(name="Test Recruiter", email="recruiter@test.com", hashed_password=get_password_hash("password123"), role="Recruiter")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(client, email, password):
    res = client.post("/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
