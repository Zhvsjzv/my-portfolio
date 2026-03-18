"""
============================================================
  Zargham Chat  —  LAN WebSocket Server
  Author  : Zargham
  Version : 3.0
  Info    : Runs entirely on a Local Area Network (LAN).
            No internet connection required.
============================================================
"""

import json
import uuid
import os
import socket
from datetime import datetime
from typing import Dict

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ─────────────────────────────────────────────────────────────
#  App Init
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Zargham Chat")

# Allow every device on the LAN to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Max upload size: 10 MB
MAX_FILE_BYTES = 10 * 1024 * 1024

# Keep last 100 messages so new joiners see recent history
MAX_HISTORY  = 100
msg_store: list = []

# Make sure the uploads folder exists at startup
os.makedirs("uploads", exist_ok=True)


# ─────────────────────────────────────────────────────────────
#  Connection Manager
#  Tracks every active WebSocket and the user behind it.
# ─────────────────────────────────────────────────────────────
class ConnectionManager:

    def __init__(self):
        # user_id -> WebSocket
        self.connections: Dict[str, WebSocket] = {}
        # user_id -> {username, color}
        self.users:       Dict[str, dict]      = {}

    # ── Connect ──────────────────────────────────────────────
    async def connect(self, ws: WebSocket, uid: str, info: dict):
        await ws.accept()
        self.connections[uid] = ws
        self.users[uid]       = info
        print(f"[+] {info['username']}  joined  (id={uid})")

    # ── Disconnect ────────────────────────────────────────────
    def disconnect(self, uid: str) -> str:
        name = self.users.get(uid, {}).get("username", "?")
        self.connections.pop(uid, None)
        self.users.pop(uid, None)
        print(f"[-] {name}  left    (id={uid})")
        return name

    # ── Send to one user ─────────────────────────────────────
    async def send(self, uid: str, payload: dict):
        ws = self.connections.get(uid)
        if ws:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                pass

    # ── Broadcast to all (optionally skip one) ───────────────
    async def broadcast(self, payload: dict, skip: str = None):
        text = json.dumps(payload)
        for uid, ws in list(self.connections.items()):
            if uid == skip:
                continue
            try:
                await ws.send_text(text)
            except Exception:
                pass

    # ── Helper: online user list ──────────────────────────────
    def online_list(self) -> list:
        return [
            {"id": uid, "username": info["username"], "color": info.get("color", "#00ff88")}
            for uid, info in self.users.items()
        ]


manager = ConnectionManager()


# ─────────────────────────────────────────────────────────────
#  Static files — serve everything in /uploads
# ─────────────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ─────────────────────────────────────────────────────────────
#  HTTP Routes
# ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    """Serve the main chat page."""
    return FileResponse("index.html")


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    """
    Receive a file from the client, save it locally,
    and return the URL path and metadata.
    Rejects files larger than MAX_FILE_BYTES.
    """
    try:
        data = await file.read()

        if len(data) > MAX_FILE_BYTES:
            return {"ok": False, "error": "File too large (max 10 MB)."}

        # Keep original extension, build a collision-free name
        orig = file.filename or "file"
        ext  = os.path.splitext(orig)[1].lower()
        name = uuid.uuid4().hex + ext
        path = os.path.join("uploads", name)

        with open(path, "wb") as f:
            f.write(data)

        is_img = ext in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
        print(f"[FILE] '{orig}'  saved as  {name}  ({len(data):,} B)")

        return {
            "ok":       True,
            "name":     orig,
            "url":      f"/uploads/{name}",
            "size":     len(data),
            "is_image": is_img,
        }

    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/api/users")
async def api_users():
    """Return the list of users currently online."""
    return {"ok": True, "users": manager.online_list()}


# ─────────────────────────────────────────────────────────────
#  WebSocket  /ws/{user_id}
#  Query params:  username   display name
#                 color      neon accent colour (hex)
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/{uid}")
async def ws_endpoint(
    websocket: WebSocket,
    uid:       str,
    username:  str = "Anonymous",
    color:     str = "#00ff88",
):
    info = {"username": username, "color": color}
    await manager.connect(websocket, uid, info)

    # 1. Send a private welcome so the client knows its own ID/colour
    await manager.send(uid, {
        "type": "welcome", "user_id": uid,
        "username": username, "color": color,
    })

    # 2. Replay the last N messages as history
    if msg_store:
        await manager.send(uid, {
            "type": "history",
            "messages": msg_store[-MAX_HISTORY:],
        })

    # 3. Announce arrival to everyone (including the new user)
    await manager.broadcast({
        "type":         "user_joined",
        "user_id":      uid,
        "username":     username,
        "color":        color,
        "timestamp":    _ts(),
        "online_users": manager.online_list(),
    })

    # 4. Main receive loop
    try:
        while True:
            raw  = await websocket.receive_text()
            data = json.loads(raw)
            kind = data.get("type", "message")

            if kind == "message":
                # Stamp, store, and relay a normal chat message
                data.update({
                    "id":        data.get("id") or uuid.uuid4().hex,
                    "timestamp": _ts(),
                    "user_id":   uid,
                    "username":  username,
                    "color":     color,
                })
                msg_store.append(data)
                await manager.broadcast(data)

            elif kind == "file_message":
                # File-share event: URL already resolved by the upload endpoint
                data.update({
                    "id":        data.get("id") or uuid.uuid4().hex,
                    "timestamp": _ts(),
                    "user_id":   uid,
                    "username":  username,
                    "color":     color,
                })
                msg_store.append(data)
                await manager.broadcast(data)

            elif kind == "typing":
                # Forward typing indicator—skip the sender
                data.update({"user_id": uid, "username": username, "color": color})
                await manager.broadcast(data, skip=uid)

            elif kind == "stop_typing":
                data.update({"user_id": uid, "username": username})
                await manager.broadcast(data, skip=uid)

    except WebSocketDisconnect:
        name = manager.disconnect(uid)
        await manager.broadcast({
            "type":         "user_left",
            "user_id":      uid,
            "username":     name,
            "timestamp":    _ts(),
            "online_users": manager.online_list(),
        })


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────
def _ts() -> str:
    """Return current time as HH:MM string."""
    return datetime.now().strftime("%H:%M")


# ─────────────────────────────────────────────────────────────
#  Entry point
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        lan = socket.gethostbyname(socket.gethostname())
    except Exception:
        lan = "127.0.0.1"

    print("\n" + "=" * 60)
    print("  Zargham Chat  —  v3.0  (LAN Mode)")
    print("=" * 60)
    print(f"  Local   http://localhost:8000")
    print(f"  LAN     http://{lan}:8000")
    print("  Share the LAN address with teammates.")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
