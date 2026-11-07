"""
app/models/setting.py
─────────────────────
Key-value settings that ADMIN can change at runtime (stored in DB).
Example keys: escalate_l2_minutes, escalate_l3_minutes, excursion_minutes.
"""
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class Setting(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")

