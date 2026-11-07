"""
app/db/seed.py
──────────────
Seeds default demo storage units, contacts, settings, and users with role-based access.
Prints demo login credentials clearly on startup.
"""
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.contact import ContactPerson
from app.models.setting import Setting
from app.models.storage_unit import StorageUnit, UnitType
from app.models.user import Role, User


def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).count() == 0:
            users_data = [
                ("Store Staff", "staff@coldguard.local", "Staff123!", Role.STAFF),
                ("Store Manager", "manager@coldguard.local", "Manager123!", Role.MANAGER),
                ("Medical Officer", "med@coldguard.local", "Med123!", Role.MEDICAL_OFFICER),
                ("System Admin", "admin@coldguard.local", "Admin123!", Role.ADMIN),
            ]
            for name, email, pwd, role in users_data:
                u = User(
                    name=name,
                    email=email,
                    hashed_password=hash_password(pwd),
                    role=role,
                    is_active=True,
                )
                db.add(u)
            db.commit()
            print("=" * 60)
            print("DEMO USERS SEEDED:")
            print("  • Staff:            staff@coldguard.local   / Staff123!")
            print("  • Manager:          manager@coldguard.local / Manager123!")
            print("  • Medical Officer:  med@coldguard.local     / Med123!")
            print("  • Admin:            admin@coldguard.local   / Admin123!")
            print("=" * 60)

        # Storage Units
        if db.query(StorageUnit).count() == 0:
            units = [
                StorageUnit(
                    name="Fridge A (Vaccine Main)",
                    type=UnitType.FRIDGE,
                    location="Room 101 - Primary Bay",
                    sensor_id="ESP32-FRIDGE-A",
                    min_temp=2.0,
                    max_temp=8.0,
                    warn_low=2.5,
                    warn_high=7.5,
                    critical_min=0.0,
                    critical_max=10.0,
                ),
                StorageUnit(
                    name="Fridge B (Emergency Reserve)",
                    type=UnitType.FRIDGE,
                    location="Room 102 - Reserve Bay",
                    sensor_id="ESP32-FRIDGE-B",
                    min_temp=2.0,
                    max_temp=8.0,
                    warn_low=2.5,
                    warn_high=7.5,
                    critical_min=0.0,
                    critical_max=10.0,
                ),
                StorageUnit(
                    name="Ultra-Low Freezer C (mRNA)",
                    type=UnitType.FREEZER,
                    location="Room 105 - Cryo Section",
                    sensor_id="ESP32-CRYO-C",
                    min_temp=-50.0,
                    max_temp=-15.0,
                    warn_low=-45.0,
                    warn_high=-20.0,
                    critical_min=-60.0,
                    critical_max=-10.0,
                ),
            ]
            for u in units:
                db.add(u)
            db.commit()
            print("Default storage units seeded.")

        # Contacts for Level 1, 2, 3 escalation
        if db.query(ContactPerson).count() == 0:
            contacts = [
                ContactPerson(
                    name="Priya Sharma (Duty Staff)",
                    role="Store Staff",
                    phone="+91-9876543210",
                    email="priya.staff@coldguard.local",
                    telegram_chat_id="",
                    escalation_level=1,
                ),
                ContactPerson(
                    name="Ravi Kumar (Cold Chain Manager)",
                    role="Store Manager",
                    phone="+91-9876543211",
                    email="ravi.manager@coldguard.local",
                    telegram_chat_id="",
                    escalation_level=2,
                ),
                ContactPerson(
                    name="Dr. Anita Desai (Chief Medical Officer)",
                    role="Medical Officer",
                    phone="+91-9876543212",
                    email="dr.anita@hospital.org",
                    telegram_chat_id="",
                    escalation_level=3,
                ),
            ]
            for c in contacts:
                db.add(c)
            db.commit()
            print("Default escalation contacts seeded.")

        # Default Settings
        if db.query(Setting).count() == 0:
            settings_list = [
                Setting(key="excursion_minutes", value="5", description="Minutes outside safe range before excursion alert"),
                Setting(key="offline_minutes", value="10", description="Minutes without data before sensor offline alert"),
                Setting(key="escalate_l2_minutes", value="10", description="Minutes unacknowledged before escalating to Level 2"),
                Setting(key="escalate_l3_minutes", value="20", description="Minutes unacknowledged before escalating to Level 3"),
                Setting(key="reminder_minutes", value="10", description="Reminder interval while alert is unacknowledged"),
            ]
            for s in settings_list:
                db.add(s)
            db.commit()
            print("Default settings seeded.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_db()

