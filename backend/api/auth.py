from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User
from services.auth import (
    hash_password, verify_password, create_jwt, decode_jwt, verify_google_token,
)
from services.email import generate_magic_token, store_magic_token, send_magic_link
from config import MAGIC_LINK_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ──────────────────────────────────────
class RegisterBody(BaseModel):
    username: str
    password: str
    email: EmailStr | None = None

class LoginBody(BaseModel):
    username: str
    password: str

class GoogleBody(BaseModel):
    credential: str  # Google ID token from the client

class EmailLinkBody(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    token: str
    uid: str
    username: str
    onboarding_status: str | None = None
    is_admin: bool = False


# ── JWT dependency ───────────────────────────────
async def get_current_user(
    token: str = Depends(lambda: None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Extract user from Authorization header. Use as Depends(get_current_user)."""
    # Note: the actual header extraction happens in the endpoint;
    # this is a helper called with an explicit token string.
    return None  # placeholder — actual auth logic is inline in endpoints for clarity


# ── Routes ───────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db)):
    # Check existing
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    uid = f"u_{body.username}"
    user = User(
        uid=uid,
        username=body.username,
        password_hash=hash_password(body.password),
        email=body.email,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_jwt(user.uid)
    return TokenResponse(
        token=token, uid=user.uid, username=user.username,
        onboarding_status=user.onboarding_status, is_admin=user.is_admin,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_jwt(user.uid)
    return TokenResponse(
        token=token, uid=user.uid, username=user.username,
        onboarding_status=user.onboarding_status, is_admin=user.is_admin,
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleBody, db: AsyncSession = Depends(get_db)):
    claims = verify_google_token(body.credential)
    if not claims:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    google_id = claims["sub"]
    email = claims.get("email", "")
    name = claims.get("name", "")

    # Find existing user by google_id
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        # Try to find by email, link accounts
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.google_id = google_id
        else:
            # New user
            uid = f"g_{google_id[:16]}"
            user = User(
                uid=uid,
                username=email or uid,
                password_hash=hash_password(google_id),  # placeholder
                email=email,
                google_id=google_id,
                en_name=name,
            )
            db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_jwt(user.uid)
    return TokenResponse(
        token=token, uid=user.uid, username=user.username,
        onboarding_status=user.onboarding_status, is_admin=user.is_admin,
    )


@router.post("/email-link")
async def send_email_link(body: EmailLinkBody, db: AsyncSession = Depends(get_db)):
    # Find or create user by email
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        uid = f"e_{body.email}"
        user = User(
            uid=uid,
            username=body.email,
            password_hash=hash_password(body.email),  # placeholder
            email=body.email,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    magic_token = generate_magic_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)
    store_magic_token(magic_token, user.uid, body.email, expires_at)

    sent = await send_magic_link(body.email, magic_token)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"message": "Magic link sent", "email": body.email}


@router.get("/magic/{token}", response_model=TokenResponse)
async def verify_magic_link(token: str, db: AsyncSession = Depends(get_db)):
    from services.email import consume_magic_token
    data = consume_magic_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid or expired magic link")

    result = await db.execute(select(User).where(User.uid == data["uid"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    jwt_token = create_jwt(user.uid)
    return TokenResponse(
        token=jwt_token, uid=user.uid, username=user.username,
        onboarding_status=user.onboarding_status, is_admin=user.is_admin,
    )
