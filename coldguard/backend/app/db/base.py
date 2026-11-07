"""
app/db/base.py
──────────────
Imports all models so Alembic can discover them for migrations.
"""
from app.db.base_class import Base  # noqa: F401

# Import every model here so Alembic sees them
from app.models.user import User  # noqa: F401
from app.models.storage_unit import StorageUnit  # noqa: F401
from app.models.reading import Reading  # noqa: F401
from app.models.alert import Alert, AlertEvent  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.contact import ContactPerson  # noqa: F401
from app.models.setting import Setting  # noqa: F401

