from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    uid          = Column(String, primary_key=True, index=True)
    username     = Column(String, unique=True, index=True, nullable=False)
    password_hash= Column(String, nullable=False)
    email        = Column(String, unique=True, index=True, nullable=True)
    google_id    = Column(String, unique=True, nullable=True)
    zh_name      = Column(String, default="")
    en_name      = Column(String, default="")
    city         = Column(String, default="")
    school       = Column(String, default="")
    industry     = Column(String, default="")
    credentials  = Column(String, default="")
    quote        = Column(String, default="")
    intents      = Column(JSON, default=list)
    hidden_signals = Column(String, default="")
    mbti         = Column(String, default="")
    enrollment_year = Column(Integer, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    major        = Column(String, default="")
    company      = Column(String, default="")
    position     = Column(String, default="")
    photo_url    = Column(Text, default="")
    onboarding_status = Column(String, default="started")  # started | in_progress | completed
    onboarding_progress = Column(JSON, default=dict)
    is_admin     = Column(Boolean, default=False)
    verified     = Column(Boolean, default=False)      # admin verification flag
    flagged      = Column(Boolean, default=False)      # admin flag
    check_in_number = Column(Integer, nullable=True)
    started_at   = Column(DateTime(timezone=True), server_default=func.now())
    admin_updated_at = Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    sent_notifications     = relationship("Notification", foreign_keys="Notification.from_uid", back_populates="from_user")
    received_notifications = relationship("Notification", foreign_keys="Notification.to_uid", back_populates="to_user")


class Notification(Base):
    __tablename__ = "notifications"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    to_uid       = Column(String, ForeignKey("users.uid"), nullable=False, index=True)
    from_uid     = Column(String, ForeignKey("users.uid"), nullable=False)
    type         = Column(String, default="dm_request")  # dm_request | system | admin
    status       = Column(String, default="pending")      # pending | accepted | rejected
    message      = Column(String, default="")
    from_name    = Column(String, default="")    # sender's display name (en or zh)
    from_zh_name = Column(String, default="")    # sender's Chinese name
    from_initials= Column(String, default="")    # first 2 chars uppercase, e.g. "JD"
    from_color   = Column(String, default="#4A3A5A")  # avatar background color
    read         = Column(Boolean, default=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    to_user   = relationship("User", foreign_keys=[to_uid], back_populates="received_notifications")
    from_user = relationship("User", foreign_keys=[from_uid], back_populates="sent_notifications")


class DMThread(Base):
    __tablename__ = "dm_threads"

    id             = Column(String, primary_key=True)  # deterministic: sorted(uidA, uidB).join("_")
    participants   = Column(JSON, default=list)        # [uidA, uidB]
    last_message   = Column(String, default="")
    last_sender_uid= Column(String, default="")
    last_timestamp = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class DMMessage(Base):
    __tablename__ = "dm_messages"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    thread_id = Column(String, ForeignKey("dm_threads.id"), nullable=False, index=True)
    sender_uid= Column(String, nullable=False)
    text      = Column(Text, default="")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
