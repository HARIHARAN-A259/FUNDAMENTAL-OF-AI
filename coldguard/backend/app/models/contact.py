"""
app/models/contact.py
─────────────────────
ContactPerson: who to notify at each escalation level.
Linked to escalation_level (1=Staff, 2=Manager, 3=Medical Officer).
"""
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class ContactPerson(Base):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    telegram_chat_id: Mapped[str] = mapped_column(String(100), default="")
    escalation_level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, or 3

