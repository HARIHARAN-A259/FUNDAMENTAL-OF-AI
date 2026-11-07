"""
app/services/ws_manager.py
──────────────────────────
WebSocket connection manager.
Keeps a list of active connections and broadcasts JSON events to all of them.
The monitoring engine and escalation agent call broadcast() to push updates.
"""
import json
import logging
from typing import Any

from fastapi import WebSocket

log = logging.getLogger("ws_manager")


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)
        log.info("WebSocket connected. Total: %d", len(self.active))

    def disconnect(self, ws: WebSocket) -> None:
        self.active.remove(ws)
        log.info("WebSocket disconnected. Total: %d", len(self.active))

    async def broadcast(self, data: Any) -> None:
        """Send JSON data to every connected client."""
        message = json.dumps(data, default=str)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


# Global singleton
ws_manager = ConnectionManager()

