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
    zh_name: str
    en_name: str
    city: str
    school: str
    industry: str
    credentials: str
    quote: str
    intents: list
    hidden_signals: str
    photo_url: str
    onboarding_status: str
    onboarding_progress: dict
    is_admin: bool = False
    verified: bool = False
    flagged: bool = False
    check_in_number: int | None = None

    class Config:
        from_attributes = True


def user_to_response(u: User) -> UserResponse:
    return UserResponse(
        uid=u.uid, username=u.username, email=u.email,
        zh_name=u.zh_name, en_name=u.en_name, city=u.city,
        school=u.school, industry=u.industry, credentials=u.credentials,
        quote=u.quote, intents=u.intents or [], hidden_signals=u.hidden_signals or "",
        photo_url=u.photo_url or "", onboarding_status=u.onboarding_status or "started",
        onboarding_progress=u.onboarding_progress or {}, is_admin=u.is_admin or False,
        verified=u.verified or False, flagged=u.flagged or False,
        check_in_number=u.check_in_number,
    )


# ── Routes ───────────────────────────────────────
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
