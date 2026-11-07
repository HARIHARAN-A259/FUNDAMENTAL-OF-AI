"""
app/api/routes/contacts.py
──────────────────────────
CRUD for escalation contact persons (Admin only).
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models.contact import ContactPerson
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=List[ContactOut], summary="List all contacts")
def list_contacts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(ContactPerson).order_by(ContactPerson.escalation_level).all()


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    contact = ContactPerson(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: int, payload: ContactUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    contact = db.query(ContactPerson).filter(ContactPerson.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(contact, k, v)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    contact = db.query(ContactPerson).filter(ContactPerson.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()

