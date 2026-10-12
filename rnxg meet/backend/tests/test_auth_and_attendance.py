import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app, Base, get_db, User, Meeting, Attendance

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


def override_get_db():
    with TestingSessionLocal() as db:
        yield db


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_1_registration_with_valid_data(client):
    """Test 1: Registration with valid data assigns unique Attendance ID and MEMBER role."""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alex Mercer",
            "email": "alex@rnxg.org",
            "password": "SecurePassword123!",
            "year": "SY",
            "branch": "Computer Science",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alex Mercer"
    assert data["email"] == "alex@rnxg.org"
    assert data["role"] == "MEMBER"
    assert data["year"] == "SY"
    assert data["branch"] == "Computer Science"
    assert data["attendance_id"] is not None
    assert data["attendance_id"].startswith("RNXG-")
    assert "password_hash" not in data
    assert "rnxg_session" in response.cookies


def test_2_registration_with_duplicate_email(client):
    """Test 2: Registration with a duplicate email returns 409 Conflict."""
    payload = {
        "name": "Alex Mercer",
        "email": "duplicate@rnxg.org",
        "password": "SecurePassword123!",
        "year": "SY",
        "branch": "Computer Science",
    }
    first_res = client.post("/api/auth/register", json=payload)
    assert first_res.status_code == 201

    second_res = client.post("/api/auth/register", json=payload)
    assert second_res.status_code == 409
    assert "already exists" in second_res.json()["detail"].lower()


def test_3_invalid_email_and_password_validation(client):
    """Test 3: Invalid email and short password fail with 422 Unprocessable Entity."""
    # Invalid email
    res1 = client.post(
        "/api/auth/register",
        json={
            "name": "Bad Email",
            "email": "not-an-email",
            "password": "SecurePassword123!",
        },
    )
    assert res1.status_code == 422

    # Short password (less than 10 characters)
    res2 = client.post(
        "/api/auth/register",
        json={
            "name": "Short Pass",
            "email": "shortpass@rnxg.org",
            "password": "short",
        },
    )
    assert res2.status_code == 422


def test_4_successful_sign_in(client):
    """Test 4: Successful sign-in returns user info and sets session cookie."""
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Test Member",
            "email": "signin@rnxg.org",
            "password": "ValidPassword999!",
        },
    )
    assert reg.status_code == 201

    login_res = client.post(
        "/api/auth/login",
        json={"email": "signin@rnxg.org", "password": "ValidPassword999!"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["email"] == "signin@rnxg.org"
    assert "rnxg_session" in login_res.cookies


def test_5_incorrect_credentials(client):
    """Test 5: Incorrect email or password returns 401 with generic safe error message."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "known@rnxg.org",
            "password": "ValidPassword999!",
        },
    )

    # Wrong password for existing user
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "known@rnxg.org", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401
    assert "incorrect" in bad_login.json()["detail"].lower()

    # Nonexistent user
    unknown_login = client.post(
        "/api/auth/login",
        json={"email": "unknown@rnxg.org", "password": "AnyPassword!"},
    )
    assert unknown_login.status_code == 401
    assert "incorrect" in unknown_login.json()["detail"].lower()


def test_6_dashboard_access_without_authentication(client):
    """Test 6: Protected dashboard routes return 401 when accessed without authentication."""
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/meetings/upcoming").status_code == 401
    assert client.get("/api/attendance/summary").status_code == 401
    assert client.get("/api/attendance/history").status_code == 401


def test_7_dashboard_access_after_sign_in(client):
    """Test 7: Protected dashboard endpoints return valid data after authentication."""
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Dashboard Tester",
            "email": "dash@rnxg.org",
            "password": "ValidPassword999!",
            "year": "TY",
            "branch": "EXTC",
        },
    )
    assert reg.status_code == 201

    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Dashboard Tester"

    meetings_res = client.get("/api/meetings/upcoming")
    assert meetings_res.status_code == 200
    assert isinstance(meetings_res.json(), list)

    summary_res = client.get("/api/attendance/summary")
    assert summary_res.status_code == 200
    assert summary_res.json()["total_meetings"] == 0
    assert summary_res.json()["attendance_rate"] == 0.0

    history_res = client.get("/api/attendance/history")
    assert history_res.status_code == 200
    assert isinstance(history_res.json(), list)


def test_8_logout_and_subsequent_protected_access(client):
    """Test 8: Logout invalidates the session cookie and prevents subsequent protected access."""
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Logout Tester",
            "email": "logout@rnxg.org",
            "password": "ValidPassword999!",
        },
    )
    assert reg.status_code == 201

    # Verify access works before logout
    assert client.get("/api/auth/me").status_code == 200

    # Logout
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 204

    # Subsequent access fails
    assert client.get("/api/auth/me").status_code == 401


def test_9_attendance_id_uniqueness_and_persistence(client):
    """Test 9: Attendance IDs are server-assigned, unique, persistent, and unalterable."""
    u1 = client.post(
        "/api/auth/register",
        json={
            "name": "User One",
            "email": "user1@rnxg.org",
            "password": "ValidPassword999!",
        },
    ).json()

    c2 = TestClient(app)
    u2 = c2.post(
        "/api/auth/register",
        json={
            "name": "User Two",
            "email": "user2@rnxg.org",
            "password": "ValidPassword999!",
        },
    ).json()

    # Unique
    assert u1["attendance_id"] != u2["attendance_id"]
    assert u1["attendance_id"].startswith("RNXG-")
    assert u2["attendance_id"].startswith("RNXG-")

    # User cannot change attendance ID once assigned
    reassign_res = client.post(
        "/api/auth/attendance-id",
        json={"attendance_id": "RNXG-NEWID123"},
    )
    assert reassign_res.status_code == 409
    assert "already been set" in reassign_res.json()["detail"].lower()


def test_10_role_enforcement_and_no_self_elevation(client):
    """Test 10: Users cannot elevate role to ADMIN/COORDINATOR on registration."""
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Hacker WannaBe",
            "email": "hacker@rnxg.org",
            "password": "ValidPassword999!",
            "role": "ADMIN",  # Attempt self-elevation
        },
    )
    assert res.status_code == 201
    assert res.json()["role"] == "MEMBER"


def test_11_backend_safe_error_responses(client):
    """Test 11: Backend returns safe error responses with no internal tracebacks."""
    res = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@rnxg.org", "password": "wrong"},
    )
    assert res.status_code == 401
    data = res.json()
    assert "detail" in data
    assert "traceback" not in str(data).lower()
    assert "sqlite" not in str(data).lower()
