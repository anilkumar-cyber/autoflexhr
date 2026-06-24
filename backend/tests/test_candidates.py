"""Candidates: duplicate-email enforcement, recruiter assignment, bulk resume import."""
import io
import pytest
from sqlalchemy.exc import IntegrityError

from app.database.models import Candidate
from tests.conftest import auth_headers


def test_create_candidate_duplicate_email_rejected(client):
    payload = {"name": "Jane Doe", "email": "jane@test.com", "job_title": "Engineer"}
    assert client.post("/candidates/", json=payload).status_code == 200
    res = client.post("/candidates/", json={**payload, "name": "Jane Doe Again"})
    assert res.status_code == 409


def test_unique_active_email_constraint_enforced_at_db_level(db_session):
    """The DB-level partial unique index is the real guard against the
    check-then-insert race condition (see uq_candidates_active_email)."""
    db_session.add(Candidate(name="A", email="race@test.com"))
    db_session.commit()
    db_session.add(Candidate(name="B", email="race@test.com"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_trashed_duplicate_email_does_not_block_new_active_candidate(client, db_session):
    trashed = Candidate(name="Old", email="comeback@test.com", is_deleted=True)
    db_session.add(trashed)
    db_session.commit()
    res = client.post("/candidates/", json={"name": "New", "email": "comeback@test.com"})
    assert res.status_code == 200


def test_assign_candidate_requires_admin(client, recruiter_user, db_session):
    candidate = Candidate(name="Target", email="target@test.com")
    db_session.add(candidate)
    db_session.commit()
    headers = auth_headers(client, "recruiter@test.com", "password123")
    res = client.put(f"/candidates/{candidate.id}/assign", json={"assigned_recruiter_id": recruiter_user.id}, headers=headers)
    assert res.status_code == 403


def test_admin_can_assign_candidate_to_recruiter(client, admin_user, recruiter_user, db_session):
    candidate = Candidate(name="Target", email="target2@test.com")
    db_session.add(candidate)
    db_session.commit()
    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.put(f"/candidates/{candidate.id}/assign", json={"assigned_recruiter_id": recruiter_user.id}, headers=headers)
    assert res.status_code == 200
    assert res.json()["assigned_recruiter_id"] == recruiter_user.id


def test_assign_to_nonexistent_recruiter_fails(client, admin_user, db_session):
    candidate = Candidate(name="Target", email="target3@test.com")
    db_session.add(candidate)
    db_session.commit()
    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.put(f"/candidates/{candidate.id}/assign", json={"assigned_recruiter_id": 999999}, headers=headers)
    assert res.status_code == 404


def test_bulk_resumes_requires_admin(client, recruiter_user):
    headers = auth_headers(client, "recruiter@test.com", "password123")
    res = client.post(
        "/candidates/bulk-resumes",
        files={"resumes": ("resume.pdf", io.BytesIO(b"%PDF-fake"), "application/pdf")},
        headers=headers,
    )
    assert res.status_code == 403


def test_bulk_resumes_creates_candidate(client, admin_user, monkeypatch):
    monkeypatch.setattr("app.api.candidates._extract_pdf_text", lambda resume: "Some resume text")
    monkeypatch.setattr("app.api.candidates._save_resume", lambda resume: "/uploads/resumes/fake.pdf")

    async def fake_parse(text):
        return {
            "name": "Parsed Name", "email": "parsed@test.com", "phone": "123",
            "skills": "Python", "education": "BSc", "experience": "2 years", "city": "Pune",
            "ats_score": 70,
        }
    monkeypatch.setattr("app.api.candidates.parse_resume_text", fake_parse)

    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.post(
        "/candidates/bulk-resumes",
        files={"resumes": ("resume.pdf", io.BytesIO(b"%PDF-fake"), "application/pdf")},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body["created"]) == 1
    assert body["created"][0]["email"] == "parsed@test.com"
    assert body["created"][0]["ats_score"] == 70
    assert body["skipped"] == []


def test_bulk_resumes_skips_duplicate_email(client, admin_user, db_session, monkeypatch):
    db_session.add(Candidate(name="Existing", email="dupe@test.com"))
    db_session.commit()

    monkeypatch.setattr("app.api.candidates._extract_pdf_text", lambda resume: "Some resume text")
    monkeypatch.setattr("app.api.candidates._save_resume", lambda resume: "/uploads/resumes/fake.pdf")

    async def fake_parse(text):
        return {"name": "Dupe", "email": "dupe@test.com", "ats_score": 50}
    monkeypatch.setattr("app.api.candidates.parse_resume_text", fake_parse)

    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.post(
        "/candidates/bulk-resumes",
        files={"resumes": ("resume.pdf", io.BytesIO(b"%PDF-fake"), "application/pdf")},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == []
    assert len(body["skipped"]) == 1


def test_bulk_resumes_skips_unparseable_pdf(client, admin_user, monkeypatch):
    monkeypatch.setattr("app.api.candidates._extract_pdf_text", lambda resume: "")
    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.post(
        "/candidates/bulk-resumes",
        files={"resumes": ("blank.pdf", io.BytesIO(b"%PDF-fake"), "application/pdf")},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == []
    assert len(body["skipped"]) == 1
