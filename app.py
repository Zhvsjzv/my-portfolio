"""
============================================================
  Zargham Chat  —  Flask-SocketIO LAN Messenger
  Author  : Zargham
  Version : 4.0  (Flask + Flask-SocketIO)
  Info    : 100% offline.  Runs on a Local Area Network.
            No internet required.
============================================================

Folder structure expected:
  app.py
  templates/
      index.html
  static/
      style.css
      script.js
  uploads/           ← created automatically for file shares

Run:
  python app.py
  Then open  http://<LAN-IP>:5000  on any device on the network.
============================================================
"""

import os
import uuid
from datetime import datetime

from flask import (
    Flask, render_template, request,
    session, redirect, url_for, jsonify, send_from_directory
)
from flask_socketio import SocketIO, emit, disconnect

# ─────────────────────────────────────────────────────────────
#  App & SocketIO Setup
# ─────────────────────────────────────────────────────────────
app = Flask(__name__)

# Secret key for session cookies — change this to something random in production
app.secret_key = "zargham_lan_chat_secret_2026"

# Allow all origins so every LAN device can connect
# async_mode='eventlet' gives the best performance for SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# ─────────────────────────────────────────────────────────────
#  In-Memory State
#  active_users  :  { sid: { "username": str, "sid": str } }
#  conversations :  not stored server-side; clients manage history
# ─────────────────────────────────────────────────────────────
active_users: dict = {}

# Max allowed file upload size: 10 MB
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allowed file extensions for uploads
ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp",
               ".pdf", ".txt", ".doc", ".docx", ".zip", ".mp4"}


# ─────────────────────────────────────────────────────────────
#  HTTP Routes
# ─────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """
    Main page.
    If the user has a valid session, serve the chat UI.
    Otherwise redirect to the login page.
    """
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Simple local login — just a username, no password.
    GET  → show the login form (rendered by index.html before JS hides it)
    POST → validate username, store in session, redirect to chat.
    """
    if request.method == "POST":
        # Support both JSON (fetch) and regular form POST
        if request.is_json:
            data = request.get_json()
            username = (data or {}).get("username", "").strip()
        else:
            username = request.form.get("username", "").strip()

        if len(username) < 2:
            msg = "Username must be at least 2 characters."
            if request.is_json:
                return jsonify({"ok": False, "error": msg}), 400
            return redirect(url_for("login") + "?error=" + msg)

        if len(username) > 24:
            msg = "Username must be 24 characters or fewer."
            if request.is_json:
                return jsonify({"ok": False, "error": msg}), 400
            return redirect(url_for("login") + "?error=" + msg)

        session["username"] = username
        if request.is_json:
            return jsonify({"ok": True})
        return redirect(url_for("index"))

    # GET — redirect already-logged-in users
    if "username" in session:
        return redirect(url_for("index"))
    return render_template("index.html", username=None)


@app.route("/logout")
def logout():
    """Clear session and redirect to login."""
    session.clear()
    return redirect(url_for("login"))


@app.route("/upload", methods=["POST"])
def upload():
    """
    Accept a file from the client, save it in /uploads,
    and return its accessible URL.
    """
    if "username" not in session:
        return jsonify({"ok": False, "error": "Not logged in"}), 401

    f = request.files.get("file")
    if not f:
        return jsonify({"ok": False, "error": "No file provided"}), 400

    ext  = os.path.splitext(f.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        return jsonify({"ok": False, "error": f"File type '{ext}' not allowed."}), 400

    name = uuid.uuid4().hex + ext
    path = os.path.join(UPLOAD_FOLDER, name)
    f.save(path)

    is_img = ext in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}
    size   = os.path.getsize(path)
    print(f"[FILE] saved '{f.filename}' → {name}  ({size:,} B)")

    return jsonify({
        "ok":       True,
        "url":      f"/uploads/{name}",
        "name":     f.filename,
        "size":     size,
        "is_image": is_img,
    })


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """Serve a previously uploaded file."""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ─────────────────────────────────────────────────────────────
#  SocketIO Events
# ─────────────────────────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    """
    Fired when a client opens the WebSocket.
    We reject the connection if the user has no valid session.
    """
    if "username" not in session:
        # Refuse unauthenticated sockets
        return False

    sid      = request.sid
    username = session["username"]

    # Register this connection
    active_users[sid] = {"username": username, "sid": sid}
    print(f"[+] {username}  connected  (sid={sid[:8]}…)")

    # Tell the new user their own SID and username
    emit("your_info", {"sid": sid, "username": username})

    # Broadcast the updated user list to everyone
    _broadcast_user_list()


@socketio.on("disconnect")
def on_disconnect():
    """
    Fired when a client closes the tab or loses connection.
    Remove them from the active list and tell everyone.
    """
    sid  = request.sid
    info = active_users.pop(sid, {})
    name = info.get("username", "?")
    print(f"[-] {name}  disconnected  (sid={sid[:8]}…)")

    # Let other users know this person went offline
    _broadcast_user_list()


@socketio.on("private_message")
def on_private_message(data):
    """
    Route a private message from one user to another.
    data = { to_sid: str, text: str }
    The message is echoed back to the sender as confirmation,
    and delivered to the recipient.
    """
    sender_sid  = request.sid
    sender_info = active_users.get(sender_sid)

    if not sender_info:
        return  # unknown sender

    to_sid = data.get("to_sid", "").strip()
    text   = data.get("text",   "").strip()

    if not to_sid or not text:
        return

    payload = {
        "from_sid":      sender_sid,
        "from_username": sender_info["username"],
        "to_sid":        to_sid,
        "text":          text,
        "timestamp":     _ts(),
    }

    # Deliver to recipient (if still connected)
    if to_sid in active_users:
        emit("receive_message", payload, to=to_sid)

    # Confirm delivery to the sender so their UI can display it
    emit("message_sent", payload)


@socketio.on("file_message")
def on_file_message(data):
    """
    Route a file-share notification to a private recipient.
    data = { to_sid, url, name, size, is_image }
    """
    sender_sid  = request.sid
    sender_info = active_users.get(sender_sid)
    if not sender_info:
        return

    to_sid = data.get("to_sid", "")
    if not to_sid:
        return

    payload = {
        "from_sid":      sender_sid,
        "from_username": sender_info["username"],
        "to_sid":        to_sid,
        "url":           data.get("url",      ""),
        "name":          data.get("name",     "file"),
        "size":          data.get("size",     0),
        "is_image":      data.get("is_image", False),
        "timestamp":     _ts(),
        "type":          "file",
    }

    if to_sid in active_users:
        emit("receive_message", payload, to=to_sid)

    emit("message_sent", payload)


@socketio.on("typing")
def on_typing(data):
    """Forward a 'is typing' hint to the target user only."""
    to_sid = data.get("to_sid")
    if to_sid and request.sid in active_users:
        emit("user_typing", {
            "from_sid":  request.sid,
            "username":  active_users[request.sid]["username"],
        }, to=to_sid)


@socketio.on("stop_typing")
def on_stop_typing(data):
    """Forward a 'stopped typing' hint to the target user only."""
    to_sid = data.get("to_sid")
    if to_sid and request.sid in active_users:
        emit("user_stop_typing", {"from_sid": request.sid}, to=to_sid)


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _broadcast_user_list():
    """Emit the current online user list to every connected client."""
    socketio.emit("user_list", {"users": list(active_users.values())})


def _ts() -> str:
    """Return current time as HH:MM."""
    return datetime.now().strftime("%H:%M")


# ─────────────────────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import socket

    try:
        lan_ip = socket.gethostbyname(socket.gethostname())
    except Exception:
        lan_ip = "127.0.0.1"

    print("\n" + "=" * 60)
    print("  Zargham Chat  —  v4.0  (Flask-SocketIO)")
    print("=" * 60)
    print(f"  Local   →  http://localhost:5000")
    print(f"  LAN     →  http://{lan_ip}:5000")
    print("  Share the LAN address with teammates on your network.")
    print("  Press  Ctrl+C  to stop.")
    print("=" * 60 + "\n")

    # host="0.0.0.0"  makes the server reachable from the entire LAN
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
