"""app/schemas/contact.py"""
from typing import Optional
from pydantic import BaseModel


class ContactCreate(BaseModel):
    name: str
    role: str
    phone: str = ""
    email: str = ""
    telegram_chat_id: str = ""
    escalation_level: int  # 1, 2, or 3


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    escalation_level: Optional[int] = None


class ContactOut(BaseModel):
    id: int
    name: str
    role: str
    phone: str
    email: str
    telegram_chat_id: str
    escalation_level: int

    model_config = {"from_attributes": True}

