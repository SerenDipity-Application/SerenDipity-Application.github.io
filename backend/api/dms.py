from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from pydantic import BaseModel
from database import get_db
from models.user import DMThread, DMMessage
from api.users import require_auth, User

router = APIRouter(prefix="/dms", tags=["dms"])


class SendMessageBody(BaseModel):
    thread_id: str | None = None  # if None, create a new thread
    other_uid: str
    text: str


class MessageResponse(BaseModel):
    id: int
    thread_id: str
    sender_uid: str
    text: str
    created_at: str

    class Config:
        from_attributes = True


class ThreadResponse(BaseModel):
    id: str
    participants: list
    last_message: str
    last_sender_uid: str
    last_timestamp: str
    other_user_uid: str
    other_user_name: str


def make_thread_id(uid_a: str, uid_b: str) -> str:
    return "_".join(sorted([uid_a, uid_b]))


@router.post("/send")
async def send_message(
    body: SendMessageBody,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    tid = body.thread_id or make_thread_id(user.uid, body.other_uid)

    # Ensure thread exists
    result = await db.execute(select(DMThread).where(DMThread.id == tid))
    thread = result.scalar_one_or_none()
    if not thread:
        thread = DMThread(id=tid, participants=[user.uid, body.other_uid])
        db.add(thread)

    msg = DMMessage(thread_id=tid, sender_uid=user.uid, text=body.text)
    thread.last_message = body.text
    thread.last_sender_uid = user.uid

    db.add(msg)
    await db.commit()

    return {"thread_id": tid, "message": "sent"}


@router.get("/threads")
async def list_threads(
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DMThread)
        .where(DMThread.participants.contains(user.uid))
        .order_by(desc(DMThread.last_timestamp))
    )
    threads = result.scalars().all()

    out = []
    for t in threads:
        other = [p for p in t.participants if p != user.uid][0]
        r = await db.execute(select(User).where(User.uid == other))
        other_user = r.scalar_one_or_none()
        out.append(ThreadResponse(
            id=t.id, participants=t.participants,
            last_message=t.last_message or "", last_sender_uid=t.last_sender_uid or "",
            last_timestamp=str(t.last_timestamp),
            other_user_uid=other,
            other_user_name=other_user.en_name or other_user.username if other_user else other,
        ))
    return out


@router.get("/{thread_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    thread_id: str,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DMMessage)
        .where(DMMessage.thread_id == thread_id)
        .order_by(DMMessage.timestamp)
    )
    msgs = result.scalars().all()
    return [MessageResponse(
        id=m.id, thread_id=m.thread_id, sender_uid=m.sender_uid,
        text=m.text, created_at=str(m.timestamp),
    ) for m in msgs]
