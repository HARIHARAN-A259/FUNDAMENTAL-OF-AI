"""
app/db/base_class.py
─────────────────────
Shared declarative base that all SQLAlchemy models inherit from.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

