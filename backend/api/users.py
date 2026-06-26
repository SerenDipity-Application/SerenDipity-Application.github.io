from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.user import User
from services.auth import decode_jwt

router = APIRouter(prefix="/users", tags=["users"])


# ── Auth helper ──────────────────────────────────
async def require_auth(authorization: str = Header(...), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    uid = decode_jwt(authorization.removeprefix("Bearer "))
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.uid == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Schemas ──────────────────────────────────────
class UserProfile(BaseModel):
    zh_name: str = ""
    en_name: str = ""
    city: str = ""
    school: str = ""
    industry: str = ""
    credentials: str = ""
    quote: str = ""
    intents: list[str] = []
    hidden_signals: str = ""
    photo_url: str = ""
    onboarding_status: str = "started"
    onboarding_progress: dict = {}
    check_in_number: int | None = None


class UserResponse(BaseModel):
    uid: str
    username: str
    email: str | None = None
    zhName: str = ""
    enName: str = ""
    city: str = ""
    school: str = ""
    industry: str = ""
    credentials: str = ""
    quote: str = ""
    intents: list = []
    hiddenSignals: str = ""
    photoURL: str = ""
    onboardingStatus: str = "started"
    onboardingProgress: dict = {}
    isAdmin: bool = False
    verified: bool = False
    flagged: bool = False
    checkInNumber: int | None = None
    schoolEn: str = ""
    industryEn: str = ""
    quoteEn: str = ""
    cityEn: str = ""
    color: str = "#4A3A5A"
    initials: str = ""

    class Config:
        from_attributes = True


def user_to_response(u: User) -> UserResponse:
    return UserResponse(
        uid=u.uid, username=u.username, email=u.email,
        zhName=u.zh_name or "", enName=u.en_name or "", city=u.city or "",
        school=u.school or "", industry=u.industry or "", credentials=u.credentials or "",
        quote=u.quote or "", intents=u.intents or [], hiddenSignals=u.hidden_signals or "",
        photoURL=u.photo_url or "", onboardingStatus=u.onboarding_status or "started",
        onboardingProgress=u.onboarding_progress or {}, isAdmin=u.is_admin or False,
        verified=u.verified or False, flagged=u.flagged or False,
        checkInNumber=u.check_in_number,
    )


# ── Routes ───────────────────────────────────────
@router.get("", response_model=list[UserResponse])
async def list_users_root(user: User = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    """Handle /users (no trailing slash) — same as /users/"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [user_to_response(u) for u in users]


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_auth)):
    return user_to_response(user)


@router.get("/{uid}", response_model=UserResponse)
async def get_user(uid: str, user: User = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.uid == uid))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(target)


@router.get("/", response_model=list[UserResponse])
async def list_users(user: User = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [user_to_response(u) for u in users]


@router.put("/me", response_model=UserResponse)
async def update_me(body: UserProfile, user: User = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user_to_response(user)
