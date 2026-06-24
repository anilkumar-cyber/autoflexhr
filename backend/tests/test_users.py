"""User management: admin-only enforcement."""
from tests.conftest import auth_headers


def test_list_users_requires_auth(client):
    res = client.get("/users/")
    assert res.status_code == 401


def test_list_users_requires_admin(client, recruiter_user):
    headers = auth_headers(client, "recruiter@test.com", "password123")
    res = client.get("/users/", headers=headers)
    assert res.status_code == 403


def test_admin_can_list_users(client, admin_user):
    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.get("/users/", headers=headers)
    assert res.status_code == 200
    assert any(u["email"] == "admin@test.com" for u in res.json())


def test_admin_can_create_recruiter(client, admin_user):
    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.post("/users/", json={
        "name": "Fresh Recruiter", "email": "fresh.recruiter@test.com", "password": "password123", "role": "Recruiter",
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["role"] == "Recruiter"


def test_recruiter_cannot_create_user(client, recruiter_user):
    headers = auth_headers(client, "recruiter@test.com", "password123")
    res = client.post("/users/", json={
        "name": "Should Fail", "email": "shouldfail@test.com", "password": "password123", "role": "Recruiter",
    }, headers=headers)
    assert res.status_code == 403


def test_create_user_duplicate_email_rejected(client, admin_user, recruiter_user):
    headers = auth_headers(client, "admin@test.com", "password123")
    res = client.post("/users/", json={
        "name": "Dup", "email": "recruiter@test.com", "password": "password123", "role": "Recruiter",
    }, headers=headers)
    assert res.status_code == 409
