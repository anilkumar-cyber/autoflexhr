"""Auth: registration role restriction, login, and rate limiting."""


def test_register_blocks_admin_role(client):
    res = client.post("/auth/register", json={
        "name": "Sneaky", "email": "sneaky@test.com", "password": "password123", "role": "Admin",
    })
    assert res.status_code == 403


def test_register_allows_employee(client):
    res = client.post("/auth/register", json={
        "name": "New Employee", "email": "employee@test.com", "password": "password123", "role": "Employee",
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "Employee"


def test_register_blocks_recruiter_role(client):
    res = client.post("/auth/register", json={
        "name": "Sneaky Recruiter", "email": "sneakyrecruiter@test.com", "password": "password123", "role": "Recruiter",
    })
    assert res.status_code == 403


def test_register_duplicate_email_rejected(client):
    payload = {"name": "Dup", "email": "dup@test.com", "password": "password123", "role": "Employee"}
    assert client.post("/auth/register", json=payload).status_code == 200
    res = client.post("/auth/register", json=payload)
    assert res.status_code == 400


def test_login_success(client, admin_user):
    res = client.post("/auth/login", json={"email": "admin@test.com", "password": "password123"})
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["role"] == "Admin"
    assert body["access_token"]


def test_login_invalid_credentials(client, admin_user):
    res = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "whatever"})
    assert res.status_code == 401


def test_invalid_token_rejected(client):
    res = client.get("/users/", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401


def test_login_rate_limited_after_five_attempts(client, admin_user):
    for _ in range(5):
        res = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrong"})
        assert res.status_code == 401
    res = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert res.status_code == 429
