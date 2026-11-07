"""
app/services/monitoring_engine.py
──────────────────────────────────
Background asyncio task – the brain of ColdGuard.

Every tick (1 real second by default, speed-adjustable):
  1. For each active unit, call the simulator to get a temperature reading.
  2. Store the reading in the DB.
  3. Run rule evaluation (safe range, warning, critical, sensor offline).
  4. Run the escalation agent for every open/escalated alert.
  5. Push live events over the WebSocket.

Design note: a real ESP32 sensor can POST to /api/readings/ingest instead of
using the simulator; the rule evaluation and escalation logic is the same.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.alert import Alert, AlertSeverity, AlertStatus, AlertType
from app.models.reading import Reading
from app.models.storage_unit import StorageUnit
from app.services.escalation_agent import resolve_alert, run_escalation
from app.services.mkt import calculate_mkt
from app.services.simulator import simulator_manager

log = logging.getLogger("monitoring_engine")

# Track per-unit state between ticks (in-memory, not in DB)
# unit_id → {"out_since": datetime|None, "last_reading": datetime|None}
_unit_state: dict[int, dict] = {}


def _get_or_create_state(unit_id: int) -> dict:
    if unit_id not in _unit_state:
        _unit_state[unit_id] = {"out_since": None, "last_reading": None}
    return _unit_state[unit_id]


def _get_open_alert(db: Session, unit_id: int, alert_type: AlertType) -> Optional[Alert]:
    return (
        db.query(Alert)
        .filter(
            Alert.unit_id == unit_id,
            Alert.type == alert_type,
            Alert.status.notin_([AlertStatus.RESOLVED]),
        )
        .first()
    )


def _open_alert(
    db: Session, unit_id: int, alert_type: AlertType,
    severity: AlertSeverity, message: str, cause: str = "",
    now: Optional[datetime] = None
) -> Alert:
    alert = Alert(
        unit_id=unit_id,
        type=alert_type,
        severity=severity,
        status=AlertStatus.OPEN,
        level=0,
        message=message,
        probable_cause=cause,
        opened_at=now or datetime.now(timezone.utc),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    log.info("Opened %s alert #%s for unit %s", alert_type.value, alert.id, unit_id)
    return alert


def _detect_cause(readings_5min: list[float]) -> str:
    """
    Rate-of-change detection:
    If temperature rose > 2 C in 5 minutes → possible door open (fast).
    If it rose slowly (<2 C) → possible power failure.
    """
    if len(readings_5min) < 2:
        return ""
    delta = readings_5min[-1] - readings_5min[0]
    if delta > 2.0:
        return "possible door open"
    if delta > 0.5:
        return "possible power failure"
    return ""


def process_reading(db: Session, unit: StorageUnit, temp: Optional[float], now: datetime, ws_push=None) -> None:
    """
    Core rule engine for one tick of one unit.
    temp = None means the sensor sent no data this tick.
    ws_push = async callable to push WebSocket events (or None).
    """
    state = _get_or_create_state(unit.id)

    # ── SENSOR OFFLINE CHECK ─────────────────────────────────────
    if temp is None:
        # Check if already offline for OFFLINE_MINUTES
        last = state["last_reading"]
        if last and (now - last).total_seconds() / 60 >= settings.OFFLINE_MINUTES:
            existing = _get_open_alert(db, unit.id, AlertType.SENSOR_OFFLINE)
            if not existing:
                _open_alert(
                    db, unit.id, AlertType.SENSOR_OFFLINE,
                    AlertSeverity.WARNING,
                    f"No data from unit '{unit.name}' for {settings.OFFLINE_MINUTES}+ minutes",
                    now=now,
                )
        return   # nothing else to do without a reading

    # We have a reading → update last_reading time
    state["last_reading"] = now

    # Resolve sensor offline alert if one was open
    offline_alert = _get_open_alert(db, unit.id, AlertType.SENSOR_OFFLINE)
    if offline_alert:
        resolve_alert(db, offline_alert)

    # Store the reading
    reading = Reading(unit_id=unit.id, temperature=temp, timestamp=now)
    db.add(reading)
    db.commit()

    if ws_push:
        asyncio.create_task(ws_push({"type": "reading", "unit_id": unit.id, "temp": temp, "ts": now.isoformat()}))

    # ── TEMPERATURE RULE CHECK ───────────────────────────────────
    in_safe = unit.min_temp <= temp <= unit.max_temp

    if in_safe:
        state["out_since"] = None
        # Resolve any open temperature alert
        temp_alert = _get_open_alert(db, unit.id, AlertType.TEMPERATURE)
        if temp_alert:
            resolve_alert(db, temp_alert)
        return

    # Out of safe range
    if state["out_since"] is None:
        state["out_since"] = now

    minutes_out = (now - state["out_since"]).total_seconds() / 60

    # Determine severity
    is_critical = temp < unit.critical_min or temp > unit.critical_max
    severity = AlertSeverity.CRITICAL if is_critical else AlertSeverity.WARNING

    # Only open/update alert if the excursion has lasted EXCURSION_MINUTES
    if minutes_out < settings.EXCURSION_MINUTES and not is_critical:
        return  # Brief excursion – do NOT alert (rule: 5-minute buffer)

    # Fetch last 5 readings for cause detection
    recent = (
        db.query(Reading.temperature)
        .filter(Reading.unit_id == unit.id)
        .order_by(Reading.timestamp.desc())
        .limit(5)
        .all()
    )
    recent_temps = [r[0] for r in reversed(recent)]
    cause = _detect_cause(recent_temps)

    existing = _get_open_alert(db, unit.id, AlertType.TEMPERATURE)
    if not existing:
        msg = f"Temperature excursion: {temp}°C (safe {unit.min_temp}-{unit.max_temp}°C)"
        alert = _open_alert(db, unit.id, AlertType.TEMPERATURE, severity, msg, cause, now=now)
    else:
        # Update severity if it has become critical
        if is_critical and existing.severity != AlertSeverity.CRITICAL:
            existing.severity = AlertSeverity.CRITICAL
            db.commit()
        alert = existing

    # Run the escalation state machine
    run_escalation(db, alert, now)


async def monitoring_loop(ws_push=None) -> None:
    """
    Main background loop – runs for the lifetime of the application.
    Loads all active units, registers them in the simulator, then ticks
    every (1 / speed) real seconds.
    """
    log.info("Monitoring engine started.")

    # Initial DB load
    db: Session = SessionLocal()
    try:
        units = db.query(StorageUnit).filter(StorageUnit.is_active == True).all()
        for unit in units:
            base = (unit.min_temp + unit.max_temp) / 2
            simulator_manager.register(unit.id, base_temp=base)
        unit_ids = [u.id for u in units]
    finally:
        db.close()

    while True:
        if simulator_manager.paused:
            await asyncio.sleep(0.5)
            continue

        speed = max(1, min(20, simulator_manager.speed))
        # Run `speed` ticks per real second
        for _ in range(speed):
            now = datetime.now(timezone.utc)
            db = SessionLocal()
            try:
                for uid in unit_ids:
                    unit = db.query(StorageUnit).filter(StorageUnit.id == uid).first()
                    if not unit or not unit.is_active:
                        continue
                    temp = simulator_manager.tick(uid)
                    process_reading(db, unit, temp, now, ws_push)
            except Exception as exc:
                log.exception("Error in monitoring tick: %s", exc)
            finally:
                db.close()

        await asyncio.sleep(1.0)

