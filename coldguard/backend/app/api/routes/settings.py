"""
app/api/routes/settings.py
──────────────────────────
Settings management (Admin only).
Allows dynamic threshold and escalation timing configuration stored in DB.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, get_current_user
from app.models.setting import Setting
from app.models.user import User
from app.schemas.setting import SettingOut, SettingUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=List[SettingOut], summary="List all system settings")
def list_settings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Setting).all()


@router.put("/{key}", response_model=SettingOut, summary="Update a system setting (Admin)")
def update_setting(
    key: str,
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    setting.value = payload.value
    db.commit()
    db.refresh(setting)
    return setting

