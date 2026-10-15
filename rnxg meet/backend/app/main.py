import os
import re
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import Boolean, DateTime, Integer, String, create_engine, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB = os.path.join(BASE_DIR, "rnxg_meet.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB}")
AUTH_SECRET = os.getenv("AUTH_SECRET", "local-development-only-change-before-deploying")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
password_hash = PasswordHash.recommended()
dummy_password_hash = password_hash.hash("not-a-real-password-for-timing-safety")
bearer_scheme = HTTPBearer(auto_error=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    attendance_id: Mapped[str | None] = mapped_column(String(24), unique=True, index=True, nullable=True)
    year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    branch: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="MEMBER")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(50), default="Official")
    target_audience: Mapped[str] = mapped_column(String(50), default="ALL")
    date: Mapped[str] = mapped_column(String(20))
    start_time: Mapped[str] = mapped_column(String(10))
    end_time: Mapped[str] = mapped_column(String(10))
    location_name: Mapped[str] = mapped_column(String(200))
    agenda: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="UPCOMING")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Attendance(Base):
    __tablename__ = "attendance"
    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(Integer, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    status: Mapped[str] = mapped_column(String(20), default="PRESENT")
    marked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


Base.metadata.create_all(engine)


def seed_initial_admin(db: Session):
    admin_email = os.getenv("INITIAL_ADMIN_EMAIL", "admin@rnxg.org").strip().lower()
    admin_password = os.getenv("INITIAL_ADMIN_PASSWORD", "AdminRNXG2026!").strip()
    admin_name = os.getenv("INITIAL_ADMIN_NAME", "RNXG System Administrator").strip()

    existing = db.scalar(select(User).where(User.email == admin_email))
    if not existing:
        admin_user = User(
            name=admin_name,
            email=admin_email,
            password_hash=password_hash.hash(admin_password),
            attendance_id="RNXG-ADMIN01",
            role="ADMIN",
            year="Faculty / Senior",
            branch="Robotics Club",
            is_active=True,
        )
        db.add(admin_user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()


@asynccontextmanager
async def lifespan(app: FastAPI):
    with SessionLocal() as db:
        seed_initial_admin(db)
    yield


app = FastAPI(title="RNXG Meet API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def get_db():
    with SessionLocal() as db:
        yield db


def generate_unique_attendance_id(db: Session) -> str:
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    for _ in range(25):
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        candidate = f"RNXG-{code}"
        existing = db.scalar(select(User.id).where(User.attendance_id == candidate))
        if not existing:
            return candidate
    raise HTTPException(status_code=500, detail="Unable to assign Attendance ID. Please try again.")


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    year: str | None = Field(default=None, max_length=20)
    branch: str | None = Field(default=None, max_length=50)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AttendanceIdInput(BaseModel):
    attendance_id: str = Field(min_length=5, max_length=24)


class UserOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    attendance_id: str | None
    role: str
    year: str | None = None
    branch: str | None = None
    is_active: bool = True
    created_at: datetime | None = None


class MeetingOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    type: str
    target_audience: str
    date: str
    start_time: str
    end_time: str
    location_name: str
    agenda: str | None = None
    status: str
    created_at: datetime | None = None


class AttendanceSummaryOutput(BaseModel):
    total_meetings: int
    attended_count: int
    attendance_rate: float
    streak: int


class AttendanceRecordOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    status: str
    marked_at: datetime


class AdminOverviewOutput(BaseModel):
    total_members: int
    total_meetings: int
    pending_approvals: int
    upcoming_meetings: int
    total_attendance_records: int
    warning_count: int


class AdminAttendanceRecordOutput(BaseModel):
    id: int
    meeting_id: int
    meeting_title: str
    user_id: int
    user_name: str
    user_attendance_id: str | None
    status: str
    marked_at: datetime


def set_session(user: User, response: Response):
    token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(hours=12)},
        AUTH_SECRET,
        algorithm="HS256",
    )
    response.set_cookie(
        "rnxg_session",
        token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=43200,
        path="/",
    )


def authenticated_user(
    request: Request, db: Session = Depends(get_db), bearer=Depends(bearer_scheme)
) -> User:
    token = request.cookies.get("rnxg_session") or (bearer.credentials if bearer else None)
    if not token:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    try:
        user_id = int(jwt.decode(token, AUTH_SECRET, algorithms=["HS256"])["sub"])
    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="This account is unavailable.")
    return user


def require_admin(user: User = Depends(authenticated_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=403, detail="Access denied. Administrator privileges required."
        )
    return user


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "RNXG Meet API"}


@app.post("/api/auth/register", response_model=UserOutput, status_code=201)
def register(payload: RegisterInput, response: Response, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    assigned_attendance_id = generate_unique_attendance_id(db)

    # Force role to MEMBER regardless of any frontend input; never allow self-elevation
    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=password_hash.hash(payload.password),
        attendance_id=assigned_attendance_id,
        year=payload.year.strip() if payload.year else None,
        branch=payload.branch.strip() if payload.branch else None,
        role="MEMBER",
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    db.refresh(user)
    set_session(user, response)
    return user


@app.post("/api/auth/login", response_model=UserOutput)
def login(payload: LoginInput, response: Response, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    candidate = user.password_hash if user else dummy_password_hash
    valid = password_hash.verify(payload.password, candidate)
    if not user or not valid or not user.is_active:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    set_session(user, response)
    return user


@app.post("/api/auth/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(
        "rnxg_session",
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )
    return None


@app.get("/api/auth/me", response_model=UserOutput)
def me(user: User = Depends(authenticated_user)):
    return user


@app.post("/api/auth/attendance-id", response_model=UserOutput)
def create_attendance_id(
    payload: AttendanceIdInput,
    user: User = Depends(authenticated_user),
    db: Session = Depends(get_db),
):
    if user.attendance_id:
        raise HTTPException(status_code=409, detail="Your RNXG Attendance ID has already been set.")
    attendance_id = payload.attendance_id.strip().upper()
    if not re.fullmatch(r"RNXG-[A-Z0-9]{4,16}", attendance_id):
        raise HTTPException(status_code=422, detail="Use RNXG- followed by 4–16 letters or numbers.")
    user.attendance_id = attendance_id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="That RNXG Attendance ID is already in use. Try another."
        )
    db.refresh(user)
    return user


@app.get("/api/meetings/upcoming", response_model=list[MeetingOutput])
def upcoming_meetings(user: User = Depends(authenticated_user), db: Session = Depends(get_db)):
    meetings = (
        db.scalars(
            select(Meeting)
            .where(Meeting.status.in_(["UPCOMING", "APPROVED", "ATTENDANCE_OPEN"]))
            .order_by(Meeting.date.asc(), Meeting.start_time.asc())
        )
        .all()
    )
    return list(meetings)


@app.get("/api/meetings/past", response_model=list[MeetingOutput])
def past_meetings(user: User = Depends(authenticated_user), db: Session = Depends(get_db)):
    meetings = (
        db.scalars(
            select(Meeting)
            .where(Meeting.status.in_(["COMPLETED", "CLOSED"]))
            .order_by(Meeting.date.desc(), Meeting.start_time.desc())
        )
        .all()
    )
    return list(meetings)


@app.get("/api/attendance/summary", response_model=AttendanceSummaryOutput)
def attendance_summary(user: User = Depends(authenticated_user), db: Session = Depends(get_db)):
    total_meetings = db.scalar(
        select(func.count(Meeting.id)).where(Meeting.status.in_(["COMPLETED", "CLOSED"]))
    ) or 0
    attended_count = db.scalar(
        select(func.count(Attendance.id)).where(
            Attendance.user_id == user.id, Attendance.status == "PRESENT"
        )
    ) or 0

    rate = round((attended_count / total_meetings * 100), 1) if total_meetings > 0 else 0.0
    return AttendanceSummaryOutput(
        total_meetings=total_meetings,
        attended_count=attended_count,
        attendance_rate=rate,
        streak=0,
    )


@app.get("/api/attendance/history", response_model=list[AttendanceRecordOutput])
def attendance_history(user: User = Depends(authenticated_user), db: Session = Depends(get_db)):
    records = (
        db.scalars(
            select(Attendance)
            .where(Attendance.user_id == user.id)
            .order_by(Attendance.marked_at.desc())
        )
        .all()
    )
    return list(records)


# =========================================================================
# Protected Admin-Only Endpoints
# =========================================================================

@app.get("/api/admin/overview", response_model=AdminOverviewOutput)
def admin_overview(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_members = db.scalar(select(func.count(User.id))) or 0
    total_meetings = db.scalar(select(func.count(Meeting.id))) or 0
    pending_approvals = db.scalar(
        select(func.count(Meeting.id)).where(Meeting.status.in_(["PENDING_APPROVAL", "DRAFT"]))
    ) or 0
    upcoming_meetings = db.scalar(
        select(func.count(Meeting.id)).where(
            Meeting.status.in_(["UPCOMING", "APPROVED", "ATTENDANCE_OPEN"])
        )
    ) or 0
    total_attendance_records = db.scalar(select(func.count(Attendance.id))) or 0

    return AdminOverviewOutput(
        total_members=total_members,
        total_meetings=total_meetings,
        pending_approvals=pending_approvals,
        upcoming_meetings=upcoming_meetings,
        total_attendance_records=total_attendance_records,
        warning_count=0,
    )


@app.get("/api/admin/members", response_model=list[UserOutput])
def admin_list_members(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Safely return all members (never exposes password_hash)
    users = db.scalars(select(User).order_by(User.id.asc())).all()
    return list(users)


@app.get("/api/admin/meetings", response_model=list[MeetingOutput])
def admin_list_meetings(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    meetings = db.scalars(select(Meeting).order_by(Meeting.date.desc())).all()
    return list(meetings)


@app.get("/api/admin/attendance", response_model=list[AdminAttendanceRecordOutput])
def admin_list_attendance(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    results = db.execute(
        select(
            Attendance.id,
            Attendance.meeting_id,
            Meeting.title.label("meeting_title"),
            Attendance.user_id,
            User.name.label("user_name"),
            User.attendance_id.label("user_attendance_id"),
            Attendance.status,
            Attendance.marked_at,
        )
        .outerjoin(Meeting, Attendance.meeting_id == Meeting.id)
        .outerjoin(User, Attendance.user_id == User.id)
        .order_by(Attendance.marked_at.desc())
    ).all()

    records = []
    for r in results:
        records.append(
            AdminAttendanceRecordOutput(
                id=r.id,
                meeting_id=r.meeting_id,
                meeting_title=r.meeting_title or f"Meeting #{r.meeting_id}",
                user_id=r.user_id,
                user_name=r.user_name or f"User #{r.user_id}",
                user_attendance_id=r.user_attendance_id,
                status=r.status,
                marked_at=r.marked_at,
            )
        )
    return records
