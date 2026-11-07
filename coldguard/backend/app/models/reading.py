"""
app/models/reading.py
─────────────────────
A temperature reading from a sensor at a point in time.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_id: Mapped[int] = mapped_column(Integer, ForeignKey("storage_units.id"), nullable=False, index=True)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )

    # Relationship
    unit = relationship("StorageUnit", back_populates="readings")

