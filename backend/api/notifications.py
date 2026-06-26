from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from database import get_db
from models.user import Notification
from api.users import require_auth, User, user_to_response

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: int
    to_uid: str
    from_uid: str
    type: str
    status: str
    message: str
    from_name: str = ""
    from_zh_name: str = ""
    from_initials: str = ""
    from_color: str = "#4A3A5A"
    read: bool = False
    created_at: str

    class Config:
        from_attributes = True


@router.post("/send")
async def send_notification(
    body: dict,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    notif = Notification(
        to_uid=body.get("to_uid"),
        from_uid=user.uid,
        type=body.get("type", "dm_request"),
        message=body.get("message", ""),
        from_name=body.get("from_name", ""),
        from_zh_name=body.get("from_zh_name", ""),
        from_initials=body.get("from_initials", ""),
        from_color=body.get("from_color", "#4A3A5A"),
    )
    db.add(notif)
    await db.commit()
    return {"id": notif.id, "message": "sent"}


@router.get("", response_model=list[NotificationResponse])
async def list_notifications_root(user: User = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    """Handle /notifications (no trailing slash)"""
    result = await db.execute(
        select(Notification)
        .where(Notification.to_uid == user.uid)
        .order_by(desc(Notification.created_at))
    )
    notifs = result.scalars().all()
    return [NotificationResponse(
        id=n.id, to_uid=n.to_uid, from_uid=n.from_uid,
        type=n.type, status=n.status, message=n.message,
        from_name=n.from_name or "", from_zh_name=n.from_zh_name or "",
        from_initials=n.from_initials or "", from_color=n.from_color or "#4A3A5A",
        read=n.read or False, created_at=str(n.created_at),
    ) for n in notifs]


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.to_uid == user.uid)
        .order_by(desc(Notification.created_at))
    )
    notifs = result.scalars().all()
    return [NotificationResponse(
        id=n.id, to_uid=n.to_uid, from_uid=n.from_uid,
        type=n.type, status=n.status, message=n.message,
        from_name=n.from_name or "", from_zh_name=n.from_zh_name or "",
        from_initials=n.from_initials or "", from_color=n.from_color or "#4A3A5A",
        read=n.read or False, created_at=str(n.created_at),
    ) for n in notifs]


@router.put("/{notif_id}/status")
async def update_status(
    notif_id: int,
    body: dict,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notification).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if not notif or notif.to_uid != user.uid:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.status = body.get("status", notif.status)
    await db.commit()
    return {"id": notif_id, "status": notif.status}
