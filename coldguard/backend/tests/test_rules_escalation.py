"""
tests/test_rules_escalation.py
Tests the cold-chain business rules and escalation agent state machine.
"""
from datetime import datetime, timedelta, timezone
from app.models.alert import Alert, AlertStatus, AlertType, AlertSeverity
from app.models.storage_unit import StorageUnit
from app.services.monitoring_engine import process_reading, _unit_state
from app.services.escalation_agent import acknowledge_alert


def test_normal_operation(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # 10 minutes of normal readings (5.0 C)
    for i in range(10):
        process_reading(db_session, unit, 5.0, now + timedelta(minutes=i))

    alerts = db_session.query(Alert).all()
    assert len(alerts) == 0


def test_brief_door_open_no_alert(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # 3 minutes above safe range (8.5 C), then back to normal
    process_reading(db_session, unit, 8.5, now)
    process_reading(db_session, unit, 9.0, now + timedelta(minutes=1))
    process_reading(db_session, unit, 8.8, now + timedelta(minutes=2))
    process_reading(db_session, unit, 5.0, now + timedelta(minutes=3))

    alerts = db_session.query(Alert).all()
    assert len(alerts) == 0  # No alert because excursion < 5 minutes!


def test_power_failure_escalation_flow(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # First 4 minutes excursion (8.5 C) -> no alert yet
    for i in range(5):
        process_reading(db_session, unit, 8.5, now + timedelta(minutes=i))

    # At minute 5: excursion alert created (Level 1)
    process_reading(db_session, unit, 8.6, now + timedelta(minutes=5))
    alert = db_session.query(Alert).filter(Alert.type == AlertType.TEMPERATURE).first()
    assert alert is not None
    assert alert.level == 1
    assert alert.status == AlertStatus.OPEN

    # 10 minutes unacknowledged since opening -> Level 2
    process_reading(db_session, unit, 8.8, now + timedelta(minutes=16))
    db_session.refresh(alert)
    assert alert.level == 2
    assert alert.status == AlertStatus.ESCALATED_L2

    # 20 minutes unacknowledged since opening -> Level 3
    process_reading(db_session, unit, 9.2, now + timedelta(minutes=26))
    db_session.refresh(alert)
    assert alert.level == 3
    assert alert.status == AlertStatus.ESCALATED_L3


def test_critical_temperature_immediate_level_3(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # Immediate critical temperature (> 10.0 C)
    process_reading(db_session, unit, 12.5, now)
    alert = db_session.query(Alert).filter(Alert.type == AlertType.TEMPERATURE).first()
    assert alert is not None
    assert alert.severity == AlertSeverity.CRITICAL
    assert alert.level == 3
    assert alert.status == AlertStatus.ESCALATED_L3


def test_acknowledgement_stops_escalation(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # Cause excursion and open alert at minute 5
    for i in range(6):
        process_reading(db_session, unit, 8.5, now + timedelta(minutes=i))

    alert = db_session.query(Alert).filter(Alert.type == AlertType.TEMPERATURE).first()
    assert alert is not None
    assert alert.level == 1

    # Staff acknowledges at minute 6
    acknowledge_alert(db_session, alert, user_id=1, user_name="Test Staff", note="Investigating")
    db_session.refresh(alert)
    assert alert.status == AlertStatus.ACKNOWLEDGED
    assert alert.acknowledged_by == "Test Staff"

    # Even 30 minutes later, alert stays acknowledged and does NOT escalate
    process_reading(db_session, unit, 9.0, now + timedelta(minutes=40))
    db_session.refresh(alert)
    assert alert.level == 1
    assert alert.status == AlertStatus.ACKNOWLEDGED


def test_auto_resolution(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # Excursion
    for i in range(6):
        process_reading(db_session, unit, 8.5, now + timedelta(minutes=i))

    alert = db_session.query(Alert).filter(Alert.type == AlertType.TEMPERATURE).first()
    assert alert is not None
    assert alert.status in (AlertStatus.OPEN, AlertStatus.ESCALATED_L2)

    # Temperature returns to 4.5 C (safe 2-8 C)
    process_reading(db_session, unit, 4.5, now + timedelta(minutes=7))
    db_session.refresh(alert)
    assert alert.status == AlertStatus.RESOLVED
    assert alert.resolved_at is not None


def test_sensor_offline_detection(db_session):
    _unit_state.clear()
    unit = db_session.query(StorageUnit).first()
    now = datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc)

    # Sensor sends data at 10:00
    process_reading(db_session, unit, 5.0, now)

    # No data for 11 minutes (temp=None)
    process_reading(db_session, unit, None, now + timedelta(minutes=11))

    offline_alert = db_session.query(Alert).filter(Alert.type == AlertType.SENSOR_OFFLINE).first()
    assert offline_alert is not None
    assert "No data from unit" in offline_alert.message

