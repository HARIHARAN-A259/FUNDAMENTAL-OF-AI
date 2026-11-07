"""
app/api/routes/ws.py
─────────────────────
WebSocket endpoint: /ws
Clients connect here to receive live events (readings, alerts, etc.)
"""
import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.ws_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Live event stream.
    Sends a heartbeat ping every 30 seconds so the connection stays alive.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Send a heartbeat every 30 seconds
            await asyncio.sleep(30)
            try:
                await websocket.send_text(json.dumps({"type": "ping"}))
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(websocket)

