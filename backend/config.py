import os
from dotenv import load_dotenv

load_dotenv()

# ── App ──────────────────────────────────────────
APP_NAME = "SerenDipity"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# ── Auth ─────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72  # 3 days

# ── Database ─────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./serendipity.db")

# ── Google OAuth ─────────────────────────────────
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id.apps.googleusercontent.com")

# ── Email (magic link) ───────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
MAGIC_LINK_EXPIRE_MINUTES = 15
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")
