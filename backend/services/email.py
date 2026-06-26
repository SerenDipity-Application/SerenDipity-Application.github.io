import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FRONTEND_URL

# In-memory store for magic link tokens (use Redis or DB in production)
_magic_links: dict[str, dict] = {}  # token -> {uid, email, expires_at}


def generate_magic_token() -> str:
    return secrets.token_urlsafe(32)


def store_magic_token(token: str, uid: str, email: str, expires_at):
    _magic_links[token] = {"uid": uid, "email": email, "expires_at": expires_at}


def consume_magic_token(token: str) -> dict | None:
    """Returns and removes the token data if valid, None if expired/missing."""
    import datetime
    data = _magic_links.pop(token, None)
    if not data:
        return None
    if datetime.datetime.now(datetime.timezone.utc) > data["expires_at"]:
        return None
    return data


async def send_magic_link(email: str, token: str) -> bool:
    """Send a magic link email. Returns True on success, False on failure."""
    link = f"{FRONTEND_URL}/auth?magic={token}"
    html = f"""\
<html><body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
<h2 style="color:#C9A84C">SerenDipity ✦</h2>
<p>Click the button below to sign in — no password needed.</p>
<p>点击下方按钮即可登录，无需密码。</p>
<a href="{link}" style="display:inline-block;background:#C9A84C;color:#1A1000;
padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;margin:16px 0;">
Sign In / 登录</a>
<p style="color:#888;font-size:12px;">This link expires in 15 minutes. / 链接 15 分钟后过期。</p>
</body></html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SerenDipity — Sign in to your account"
    msg["From"] = SMTP_USER
    msg["To"] = email
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [email], msg.as_string())
        return True
    except Exception:
        return False
