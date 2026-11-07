"""
app/services/notifier.py
─────────────────────────
Multi-channel notification service.
Channels: Console (always on), Telegram, Email.
If Telegram/Email credentials are missing, falls back to Console silently.
Every attempt is logged in the Notification table.
"""
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from typing import Optional

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification, NotifChannel, NotifStatus

log = logging.getLogger("notifier")


def _log_notification(
    db: Session,
    alert_id: Optional[int],
    level: int,
    recipient: str,
    channel: NotifChannel,
    status: NotifStatus,
    message: str,
    error: str = "",
) -> None:
    """Save a notification record to the database."""
    notif = Notification(
        alert_id=alert_id,
        level=level,
        recipient=recipient,
        channel=channel,
        status=status,
        message=message,
        error=error,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(notif)
    db.commit()


def send_console(
    db: Session, alert_id: Optional[int], level: int, recipient: str, message: str
) -> None:
    """Print to console and log in DB."""
    print(f"[ALERT L{level}] → {recipient}: {message}")
    log.info("Console notification | level=%s recipient=%s", level, recipient)
    _log_notification(db, alert_id, level, recipient, NotifChannel.CONSOLE, NotifStatus.SENT, message)


def send_telegram(
    db: Session, alert_id: Optional[int], level: int, recipient: str,
    chat_id: str, message: str
) -> bool:
    """Send a Telegram message. Returns True on success."""
    token = settings.TELEGRAM_BOT_TOKEN
    if not token or not chat_id:
        return False
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        resp = requests.post(url, json={"chat_id": chat_id, "text": message}, timeout=10)
        ok = resp.status_code == 200
        status = NotifStatus.SENT if ok else NotifStatus.FAILED
        err = "" if ok else resp.text
        _log_notification(db, alert_id, level, recipient, NotifChannel.TELEGRAM, status, message, err)
        return ok
    except Exception as exc:
        log.warning("Telegram send failed: %s", exc)
        _log_notification(db, alert_id, level, recipient, NotifChannel.TELEGRAM, NotifStatus.FAILED, message, str(exc))
        return False


def send_email(
    db: Session, alert_id: Optional[int], level: int, recipient: str,
    to_addr: str, message: str
) -> bool:
    """Send an email via SMTP. Returns True on success."""
    if not settings.SMTP_USER or not settings.SMTP_PASS or not to_addr:
        return False
    try:
        msg = MIMEText(message)
        msg["Subject"] = f"[ColdGuard] Level {level} Alert"
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_addr
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.EMAIL_FROM, [to_addr], msg.as_string())
        _log_notification(db, alert_id, level, recipient, NotifChannel.EMAIL, NotifStatus.SENT, message)
        return True
    except Exception as exc:
        log.warning("Email send failed: %s", exc)
        _log_notification(db, alert_id, level, recipient, NotifChannel.EMAIL, NotifStatus.FAILED, message, str(exc))
        return False


def notify(
    db: Session,
    alert_id: Optional[int],
    level: int,
    recipient_name: str,
    message: str,
    telegram_chat_id: str = "",
    email_addr: str = "",
) -> None:
    """
    Main notify function.
    Tries Telegram and Email; always falls back to Console.
    """
    sent_external = False

    if telegram_chat_id:
        sent_external |= send_telegram(db, alert_id, level, recipient_name, telegram_chat_id, message)

    if email_addr:
        sent_external |= send_email(db, alert_id, level, recipient_name, email_addr, message)

    # Always send to console so there is always a record
    send_console(db, alert_id, level, recipient_name, message)

