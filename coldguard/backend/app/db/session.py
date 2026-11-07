"""
app/db/session.py
─────────────────
Creates the SQLAlchemy engine and session factory.
We use the synchronous SQLAlchemy 2.0 API so it works
with both SQLite (dev) and PostgreSQL (prod) with one line change.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# connect_args is only needed for SQLite (allow usage across threads)
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency – yields a DB session, closes it on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

