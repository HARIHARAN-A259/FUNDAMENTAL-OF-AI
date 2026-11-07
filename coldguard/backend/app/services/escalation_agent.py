"""
app/services/escalation_agent.py
─────────────────────────────────
Escalation state machine – one instance per open alert.

States: OPEN → ESCALATED_L2 → ESCALATED_L3 → ACKNOWLEDGED / RESOLVED

Business rules:
  • Level 1 immediately when the alert opens (notifies Store Staff).
  • Level 2 after ESCALATE_L2_MINUTES unacknowledged (Store Manager).
  • Level 3 after ESCALATE_L3_MINUTES unacknowledged OR immediately if critical.
  • Reminder every REMINDER_MINUTES while unacknowledged at the current level.
  • Acknowledging stops all future escalations and reminders.
  • When temperature returns to normal, alert is RESOLVED.
  • Every transition → one AlertEvent row in the DB (full audit trail).
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.alert import Alert, AlertEvent, AlertEventType, AlertStatus, AlertSeverity
from app.models.contact import ContactPerson
from app.services.notifier import notify

log = logging.getLogger("escalation")

# Map escalation level to contact level number
LEVEL_RECIPIENTS = {1: 1, 2: 2, 3: 3}


def _get_contacts(db: Session, level: int) -> list[ContactPerson]:
    return db.query(ContactPerson).filter(ContactPerson.escalation_level == level).all()


def _add_event(
    db: Session,
    alert: Alert,
    event_type: AlertEventType,
    details: str = "",
    user_id: Optional[int] = None,
) -> None:
    event = AlertEvent(
        alert_id=alert.id,
        event_type=event_type,
        user_id=user_id,
        details=details,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()


def _do_notify(db: Session, alert: Alert, level: int, message: str) -> None:
    """Look up contacts for this level and send notifications."""
    contacts = _get_contacts(db, level)
    if not contacts:
        # Fallback: console notification even if no contacts configured
        notify(db, alert.id, level, f"Level {level} contact (unconfigured)", message)
        return
    for contact in contacts:
        notify(
            db, alert.id, level,
            contact.name,
            message,
            telegram_chat_id=contact.telegram_chat_id,
            email_addr=contact.email,
        )


def run_escalation(db: Session, alert: Alert, now: Optional[datetime] = None) -> None:
    """
    Called once per monitoring tick for every open/escalated alert.
    Advances the state machine and sends notifications as needed.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    # Already finished – nothing to do
    if alert.status in (AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED):
        return

    # Minutes since the alert opened
    mins_open = (now - alert.opened_at.replace(tzinfo=timezone.utc)
                 if alert.opened_at.tzinfo is None
                 else now - alert.opened_at).total_seconds() / 60

    # Minutes since the last notification was sent
    mins_since_notif = float("inf")
    if alert.last_notified_at:
        last = alert.last_notified_at
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        mins_since_notif = (now - last).total_seconds() / 60

    is_critical = alert.severity == AlertSeverity.CRITICAL

    # Decide the target escalation level
    target_level = 1
    if mins_open >= settings.ESCALATE_L2_MINUTES:
        target_level = 2
    if mins_open >= settings.ESCALATE_L3_MINUTES or is_critical:
        target_level = 3

    # Level has increased → escalate now
    if target_level > alert.level:
        alert.level = target_level
        alert.status = {
            1: AlertStatus.OPEN,
            2: AlertStatus.ESCALATED_L2,
            3: AlertStatus.ESCALATED_L3,
        }[target_level]
        alert.last_notified_at = now
        db.commit()

        event_type = AlertEventType.OPENED if target_level == 1 else AlertEventType.ESCALATED
        _add_event(db, alert, event_type, f"Escalated to Level {target_level}")

        msg = (
            f"[ColdGuard Level {target_level}] "
            f"Alert #{alert.id} – {alert.message} "
            f"(Unit #{alert.unit_id}, {alert.type.value})"
        )
        _do_notify(db, alert, target_level, msg)
        log.info("Alert #%s escalated to level %s", alert.id, target_level)

    # Same level but reminder due
    elif mins_since_notif >= settings.REMINDER_MINUTES and alert.level > 0:
        alert.last_notified_at = now
        db.commit()
        _add_event(db, alert, AlertEventType.REMINDER, f"Reminder at Level {alert.level}")
        msg = (
            f"[ColdGuard REMINDER Level {alert.level}] "
            f"Alert #{alert.id} still unacknowledged – {alert.message}"
        )
        _do_notify(db, alert, alert.level, msg)
        log.info("Alert #%s reminder sent at level %s", alert.id, alert.level)


def acknowledge_alert(
    db: Session, alert: Alert, user_id: int, user_name: str, note: str = ""
) -> None:
    """Mark alert as acknowledged. Stops all future escalation."""
    if alert.status in (AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED):
        return
    now = datetime.now(timezone.utc)
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_by = user_name
    alert.acknowledged_at = now
    db.commit()
    details = f"Acknowledged by {user_name}" + (f": {note}" if note else "")
    _add_event(db, alert, AlertEventType.ACKNOWLEDGED, details, user_id=user_id)
    notify(db, alert.id, 0, "System", f"Alert #{alert.id} acknowledged by {user_name}. Escalation stopped.")
    log.info("Alert #%s acknowledged by %s", alert.id, user_name)


def resolve_alert(db: Session, alert: Alert) -> None:
    """Mark alert as resolved (temperature returned to normal / sensor back online)."""
    if alert.status == AlertStatus.RESOLVED:
        return
    now = datetime.now(timezone.utc)
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = now
    db.commit()
    _add_event(db, alert, AlertEventType.RESOLVED, "Temperature/sensor returned to normal.")
    notify(db, alert.id, 0, "System", f"Alert #{alert.id} auto-resolved – back to normal.")
    log.info("Alert #%s resolved", alert.id)

