"""
app/main.py
───────────
FastAPI Entry Point for ColdGuard.
Includes CORS, API routes, WebSocket, background monitoring task, and /api/health.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.services.monitoring_engine import monitoring_loop
from app.services.ws_manager import ws_manager

# Import route modules
from app.api.routes import (
    alerts,
    auth,
    contacts,
    notifications,
    readings,
    reports,
    settings as settings_route,
    simulator,
    stats,
    units,
    users,
    ws,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("coldguard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist if not in test mode
    monitor_task = None
    import os
    if os.getenv("TESTING") != "1":
        Base.metadata.create_all(bind=engine)
        log.info("Database tables initialized.")

        from app.db.seed import seed_db
        try:
            seed_db()
        except Exception as e:
            log.warning("Seeding encountered: %s", e)

        monitor_task = asyncio.create_task(monitoring_loop(ws_push=ws_manager.broadcast))
        log.info("Background monitoring task created.")

    yield

    # Shutdown
    if monitor_task:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            log.info("Background monitoring task cancelled gracefully.")


app = FastAPI(
    title="ColdGuard API",
    description="Vaccine Cold-Chain Monitoring and Escalation Agent API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    settings.FRONTEND_ORIGIN,
]
# Clean up duplicates
origins = list(set([o for o in origins if o]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["system"], summary="Health Check")
def health_check():
    return {
        "status": "ok",
        "service": "ColdGuard Cold-Chain Monitor",
        "version": "1.0.0",
        "mode": "simulation",
    }


# Include Routers
app.include_router(auth.router)
app.include_router(units.router)
app.include_router(readings.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(reports.router)
app.include_router(simulator.router)
app.include_router(users.router)
app.include_router(contacts.router)
app.include_router(notifications.router)
app.include_router(settings_route.router)
app.include_router(ws.router)
