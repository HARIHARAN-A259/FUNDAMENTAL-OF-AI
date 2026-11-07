"""
app/services/report_pdf.py
──────────────────────────
Generates a daily PDF report using fpdf2.
Report includes: unit summary, min/max/avg/MKT, alert list, audit events.
Uses clean text normalization so non-ASCII characters do not break PDF rendering.
"""
import io
from datetime import date, datetime, timezone
from typing import Optional

from fpdf import FPDF
from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertStatus
from app.models.reading import Reading
from app.models.storage_unit import StorageUnit
from app.services.mkt import calculate_mkt


def clean_text(s: str) -> str:
    """Sanitize strings to safe characters supported by standard PDF fonts."""
    if not s:
        return ""
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00b0": " deg ",
        "\u2022": "*",
    }
    for orig, rep in replacements.items():
        s = s.replace(orig, rep)
    return s.encode("latin-1", "replace").decode("latin-1")


class ColdGuardPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, clean_text("ColdGuard - Daily Temperature Report"), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 6, clean_text(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"), align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def generate_daily_pdf(
    db: Session,
    report_date: Optional[date] = None,
    unit_id: Optional[int] = None,
) -> bytes:
    """
    Generate a PDF report for the given date (defaults to today).
    Returns the PDF as bytes.
    """
    if report_date is None:
        report_date = date.today()

    day_start = datetime(report_date.year, report_date.month, report_date.day, tzinfo=timezone.utc)
    day_end = datetime(report_date.year, report_date.month, report_date.day, 23, 59, 59, tzinfo=timezone.utc)

    units_q = db.query(StorageUnit).filter(StorageUnit.is_active == True)
    if unit_id:
        units_q = units_q.filter(StorageUnit.id == unit_id)
    units = units_q.all()

    pdf = ColdGuardPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, clean_text(f"Report Date: {report_date.strftime('%d %B %Y')}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    for unit in units:
        # Readings for the day
        readings = (
            db.query(Reading)
            .filter(Reading.unit_id == unit.id, Reading.timestamp >= day_start, Reading.timestamp <= day_end)
            .order_by(Reading.timestamp)
            .all()
        )
        temps = [r.temperature for r in readings]
        mkt = calculate_mkt(temps)
        min_t = min(temps) if temps else None
        max_t = max(temps) if temps else None
        avg_t = round(sum(temps) / len(temps), 2) if temps else None

        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(220, 235, 245)
        unit_header = f"  Unit: {unit.name} ({unit.type.value})  |  Location: {unit.location or '-'}"
        pdf.cell(0, 7, clean_text(unit_header), fill=True, new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("Helvetica", "", 9)
        stats_line = f"  Readings: {len(readings)}  |  Min: {min_t} C  Max: {max_t} C  Avg: {avg_t} C  MKT: {mkt} C"
        pdf.cell(0, 6, clean_text(stats_line), new_x="LMARGIN", new_y="NEXT")
        
        threshold_line = f"  Safe range: {unit.min_temp} to {unit.max_temp} C  |  Thresholds: warn {unit.warn_low}/{unit.warn_high} C  critical {unit.critical_min}/{unit.critical_max} C"
        pdf.cell(0, 6, clean_text(threshold_line), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        # Alerts for this unit on this day
        alerts = (
            db.query(Alert)
            .filter(Alert.unit_id == unit.id, Alert.opened_at >= day_start, Alert.opened_at <= day_end)
            .order_by(Alert.opened_at)
            .all()
        )
        if alerts:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 6, "  Alerts:", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 8)
            for alert in alerts:
                opened = alert.opened_at.strftime("%H:%M") if alert.opened_at else "-"
                closed = alert.resolved_at.strftime("%H:%M") if alert.resolved_at else "ongoing"
                acked = alert.acknowledged_by or "not acknowledged"
                alert_text = (
                    f"    #{alert.id} [{alert.type.value}] {opened}-{closed}  "
                    f"Level {alert.level}  Status: {alert.status.value}  Acked by: {acked}"
                )
                pdf.cell(0, 5, clean_text(alert_text), new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_font("Helvetica", "I", 9)
            pdf.cell(0, 6, "  No alerts on this day.", new_x="LMARGIN", new_y="NEXT")

        pdf.ln(4)

    # Signature lines (like a real vaccine logbook)
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(60, 6, clean_text("Staff Signature: ___________________"), new_x="RIGHT", new_y="LAST")
    pdf.cell(10, 6, "", new_x="RIGHT", new_y="LAST")
    pdf.cell(60, 6, clean_text("Manager Signature: ___________________"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    pdf.cell(60, 6, clean_text("Date: ___________________"), new_x="RIGHT", new_y="LAST")
    pdf.cell(10, 6, "", new_x="RIGHT", new_y="LAST")
    pdf.cell(60, 6, clean_text("Date: ___________________"), new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())
