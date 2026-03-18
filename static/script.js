/*
  ============================================================
  Zargham Chat — script.js
  Vanilla JS + Socket.IO client
  Handles: login, 1-on-1 private messaging, typing indicators,
           file uploads, mobile sidebar, auto-scroll.
  ============================================================
*/

/* ─────────────────────────────────────────────────────────────
   Config
───────────────────────────────────────────────────────────── */
// How long after the last keystroke before we send "stop_typing"
const TYPING_IDLE_MS = 2200;

// Colour palette — deterministically assigned to each user
const PALETTE = [
  "#00ff88", "#00ccff", "#ff6b6b", "#ffcc00",
  "#bb86fc", "#ff9144", "#ff4da6", "#44ddff",
  "#a8ff78", "#f8b500", "#e040fb", "#40c4ff",
];

/* ─────────────────────────────────────────────────────────────
   Application State
───────────────────────────────────────────────────────────── */
let socket        = null;     // Socket.IO instance
let me            = null;     // { sid, username }

// All known peers: { sid → { username, color, sid } }
const peers       = {};

// Private message history: { sid → [ {from_sid, text, timestamp, type, …} ] }
const convos      = {};

// Unread message counts per peer: { sid → number }
const unread      = {};

// Currently open chat peer SID (null = none selected)
let activePeer    = null;

// File chosen but not yet sent
let pendingFile   = null;

// Typing state
let iAmTyping     = false;
let myTypingTimer = null;

// Per-peer "they are typing" timers (auto-expire after 3 s)
const theirTyping = {};   // { sid → timerHandle }


/* ─────────────────────────────────────────────────────────────
   Boot — runs after the page loads
───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  // Focus the name field on the login screen
  const inp = document.getElementById("usernameInput");
  if (inp) {
    inp.focus();
    // Allow Enter key to submit
    inp.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  }

  // If the server already set a session (page hard-reload), go straight in
  if (window.__INITIAL_USERNAME__) {
    _showApp();
    _connectSocket();
  }
});


/* ─────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────── */

/** Called when user clicks "Join Chat" */
async function doLogin() {
  const username = document.getElementById("usernameInput").value.trim();
  if (username.length < 2) {
    _loginError("Name must be at least 2 characters.");
    return;
  }

  try {
    const res = await fetch("/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username }),
    });
    const data = await res.json();

    if (!data.ok) {
      _loginError(data.error || "Login failed.");
      return;
    }

    // Success — show the main UI and connect the socket
    _showApp();
    _connectSocket();

  } catch (err) {
    _loginError("Cannot reach the server: " + err.message);
  }
}

function _loginError(msg) {
  const el = document.getElementById("loginError");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function _showApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}


/* ─────────────────────────────────────────────────────────────
   SOCKET.IO CONNECTION
───────────────────────────────────────────────────────────── */

function _connectSocket() {
  // Connecting to "/" uses the same host (LAN IP) automatically
  socket = io("/", { transports: ["websocket", "polling"] });

  // ── Lifecycle ─────────────────────────────────────────────
  socket.on("connect", () => {
    console.log("[Socket] connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("[Socket] disconnected");
    _toast("Connection lost — reconnecting…");
  });

  // ── Server events ──────────────────────────────────────────

  // Server tells us our own SID and username
  socket.on("your_info", (data) => {
    me = { sid: data.sid, username: data.username };
    document.getElementById("myLabel").textContent = me.username;
    document.getElementById("myDot").style.background = _color(me.sid);
    document.getElementById("myDot").textContent = me.username[0].toUpperCase();
    console.log("[me]", me);
  });

  // Updated list of everyone online
  socket.on("user_list", (data) => {
    _renderUserList(data.users || []);
  });

  // An incoming private message (someone sent to us)
  socket.on("receive_message", (msg) => {
    _storeMsg(msg.from_sid, msg);
    if (activePeer === msg.from_sid) {
      _appendBubble(msg, false);
      _scrollBottom();
    } else {
      // Increment unread badge
      unread[msg.from_sid] = (unread[msg.from_sid] || 0) + 1;
      _updateUserItemBadge(msg.from_sid);
    }
    // Stop their typing indicator when they actually send
    _clearTheirTyping(msg.from_sid);
  });

  // Server confirmed our outgoing message
  socket.on("message_sent", (msg) => {
    _storeMsg(msg.to_sid, msg);
    if (activePeer === msg.to_sid) {
      _appendBubble(msg, true);
      _scrollBottom();
    }
  });

  // Peer started typing
  socket.on("user_typing", (data) => {
    if (activePeer !== data.from_sid) return;
    _showTheirTyping(data.from_sid, data.username);
  });

  // Peer stopped typing
  socket.on("user_stop_typing", (data) => {
    _clearTheirTyping(data.from_sid);
  });
}


/* ─────────────────────────────────────────────────────────────
   ONLINE USER LIST  (sidebar)
───────────────────────────────────────────────────────────── */

/**
 * Re-render the sidebar user list from a fresh server snapshot.
 * Preserves active states and unread counts.
 */
function _renderUserList(users) {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  users.forEach(u => {
    // Register in local peers map
    peers[u.sid] = { ...u, color: _color(u.sid) };

    const li  = document.createElement("li");
    const isMe = me && u.sid === me.sid;
    li.className  = "user-item" +
                    (activePeer === u.sid ? " active" : "") +
                    (!isMe && unread[u.sid] ? " unread" : "");
    li.dataset.sid = u.sid;

    const lastMsg   = _lastMsgPreview(u.sid);
    const color     = _color(u.sid);
    const initial   = u.username[0].toUpperCase();

    li.innerHTML = `
      <div class="user-avatar" style="background:${_esc(color)}">${_esc(initial)}</div>
      <div class="user-meta">
        <div class="user-name-text">
          ${_esc(u.username)}
          ${isMe ? '<span class="user-you-badge">(you)</span>' : ""}
        </div>
        <div class="user-last-msg">${_esc(lastMsg)}</div>
      </div>
      <div class="presence-dot"></div>
    `;

    // Only non-self users are clickable
    if (!isMe) {
      li.onclick = () => openChat(u.sid);
    }

    list.appendChild(li);
  });
}

/** Preview text for the last message with a given peer. */
function _lastMsgPreview(sid) {
  const msgs = convos[sid] || [];
  if (!msgs.length) return "";
  const last = msgs[msgs.length - 1];
  if (last.type === "file") return "📎 " + (last.name || "File");
  const text = last.text || "";
  return text.length > 28 ? text.slice(0, 28) + "…" : text;
}

function _updateUserItemBadge(sid) {
  const li = document.querySelector(`.user-item[data-sid="${sid}"]`);
  if (li) li.classList.add("unread");
}


/* ─────────────────────────────────────────────────────────────
   OPEN / SWITCH CHAT
───────────────────────────────────────────────────────────── */

/** Open a private conversation with a peer identified by sid. */
function openChat(sid) {
  if (!me) return;
  if (sid === me.sid) return;   // can't message yourself

  activePeer = sid;

  const peer = peers[sid];
  if (!peer) return;

  // Clear unread count
  unread[sid] = 0;

  // Update sidebar highlight
  document.querySelectorAll(".user-item").forEach(el => {
    el.classList.remove("active", "unread");
    if (el.dataset.sid === sid) el.classList.add("active");
  });

  // Show conversation panel, hide empty state
  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("conversation").classList.remove("hidden");

  // Populate header
  document.getElementById("peerName").textContent   = peer.username;
  document.getElementById("peerAvatar").textContent = peer.username[0].toUpperCase();
  document.getElementById("peerAvatar").style.background = _color(sid);
  document.getElementById("peerStatus").textContent = "Online";

  // Render history
  const msgList = document.getElementById("msgList");
  msgList.innerHTML = "";
  (convos[sid] || []).forEach(msg => {
    _appendBubble(msg, msg.from_sid === me.sid);
  });

  _scrollBottom();

  // Focus input
  document.getElementById("msgInput").focus();

  // Close mobile sidebar
  _closeSidebar();
}


/* ─────────────────────────────────────────────────────────────
   SEND MESSAGE
───────────────────────────────────────────────────────────── */

/** Called by Send button and Enter key. */
function sendMsg() {
  if (!socket || !activePeer) return;

  // If a file is pending, upload it first
  if (pendingFile) { _uploadAndSend(); return; }

  const textarea = document.getElementById("msgInput");
  const text     = textarea.value.trim();
  if (!text) return;

  // Stop typing signal immediately
  _stopMyTyping();

  socket.emit("private_message", { to_sid: activePeer, text });

  textarea.value = "";
  _autoResize();
}

/** Keyboard handler for the textarea. */
function onKey(e) {
  // Enter (no Shift) = send; Shift+Enter = newline
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMsg();
  }
}


/* ─────────────────────────────────────────────────────────────
   TYPING INDICATORS
───────────────────────────────────────────────────────────── */

/** Called on every input event in the textarea. */
function onType() {
  _autoResize();

  if (!socket || !activePeer) return;

  // Send a "typing" event if not already in typing state
  if (!iAmTyping) {
    iAmTyping = true;
    socket.emit("typing", { to_sid: activePeer });
  }

  // Reset the idle timer
  clearTimeout(myTypingTimer);
  myTypingTimer = setTimeout(_stopMyTyping, TYPING_IDLE_MS);
}

/** Emit stop_typing and reset local typing state. */
function _stopMyTyping() {
  if (iAmTyping && socket && activePeer) {
    socket.emit("stop_typing", { to_sid: activePeer });
  }
  iAmTyping = false;
  clearTimeout(myTypingTimer);
}

/** Show the "… is typing" bar for a peer. */
function _showTheirTyping(sid, username) {
  // Clear any existing expiry for this peer
  clearTimeout(theirTyping[sid]);

  // Auto-hide after 3 s of silence
  theirTyping[sid] = setTimeout(() => _clearTheirTyping(sid), 3000);

  if (activePeer !== sid) return;  // only show for current conversation

  document.getElementById("typingBar").innerHTML = `
    <div class="typing-dots"><span></span><span></span><span></span></div>
    <span>${_esc(username)} is typing</span>
  `;
}

function _clearTheirTyping(sid) {
  clearTimeout(theirTyping[sid]);
  delete theirTyping[sid];

  if (activePeer === sid) {
    document.getElementById("typingBar").innerHTML = "";
  }
}


/* ─────────────────────────────────────────────────────────────
   FILE UPLOAD
───────────────────────────────────────────────────────────── */

/** User picks a file from the file input. */
function onFileChosen(e) {
  const file = e.target.files[0];
  if (!file) return;
  pendingFile = file;
  document.getElementById("fpName").textContent = file.name;
  document.getElementById("filePreview").classList.remove("hidden");
}

/** Discard the pending file. */
function clearFile() {
  pendingFile = null;
  document.getElementById("fileInput").value = "";
  document.getElementById("filePreview").classList.add("hidden");
}

/** Upload the file then broadcast the URL via SocketIO. */
async function _uploadAndSend() {
  if (!pendingFile || !activePeer) return;

  const file = pendingFile;
  clearFile();
  _toast("Uploading " + file.name + "…");

  try {
    const form = new FormData();
    form.append("file", file);

    const res  = await fetch("/upload", { method: "POST", body: form });
    const data = await res.json();

    if (!data.ok) {
      _toast("Upload failed: " + (data.error || "unknown error"));
      return;
    }

    // Emit a file_message event so the server routes it privately
    socket.emit("file_message", {
      to_sid:   activePeer,
      url:      data.url,
      name:     data.name,
      size:     data.size,
      is_image: data.is_image,
    });

    _toast("Sent " + data.name);

  } catch (err) {
    _toast("Upload error: " + err.message);
  }
}


/* ─────────────────────────────────────────────────────────────
   BUBBLE RENDERING
───────────────────────────────────────────────────────────── */

/**
 * Create and append a message bubble to the active conversation.
 * @param {object} msg    - message data from server
 * @param {boolean} isOut - true if WE sent this message
 */
function _appendBubble(msg, isOut) {
  const list = document.getElementById("msgList");
  if (!list) return;

  const row = document.createElement("div");
  row.className = "msg-row " + (isOut ? "out" : "in");

  const avatarBg = isOut ? _color(me.sid) : _color(msg.from_sid);
  const initial  = isOut
    ? me.username[0].toUpperCase()
    : (peers[msg.from_sid]?.username || "?")[0].toUpperCase();

  // Build content inside bubble
  let bubbleContent = "";

  if (msg.type === "file") {
    // File attachment
    if (msg.is_image) {
      bubbleContent = `<img class="attach-img" src="${_esc(msg.url)}"
                           alt="${_esc(msg.name)}"
                           onclick="window.open('${_esc(msg.url)}','_blank')" />`;
    } else {
      const kb = msg.size ? Math.round(msg.size / 1024) + " KB" : "";
      bubbleContent = `
        <a class="attach-file" href="${_esc(msg.url)}" target="_blank" download>
          &#128206; ${_esc(msg.name)} ${kb ? `<span style="opacity:.6">${kb}</span>` : ""}
        </a>`;
    }
  } else {
    // Text message — linkify plain URLs
    bubbleContent = _linkify(_esc(msg.text || ""));
  }

  row.innerHTML = `
    <div class="msg-row-avatar" style="background:${_esc(avatarBg)}">${_esc(initial)}</div>
    <div class="msg-wrap">
      ${!isOut ? `<div class="msg-sender" style="color:${_esc(avatarBg)}">${_esc(peers[msg.from_sid]?.username || "")}</div>` : ""}
      <div class="msg-bubble">${bubbleContent}</div>
      <div class="msg-meta">${_esc(msg.timestamp || "")}</div>
    </div>
  `;

  list.appendChild(row);
}

/**
 * Save a message to the local conversation history.
 * Uses peer SID as the key regardless of direction.
 */
function _storeMsg(peerSid, msg) {
  if (!peerSid) return;
  if (!convos[peerSid]) convos[peerSid] = [];
  convos[peerSid].push(msg);
}


/* ─────────────────────────────────────────────────────────────
   AUTO-SCROLL
───────────────────────────────────────────────────────────── */

/**
 * Scroll the message list to the very bottom.
 * Uses requestAnimationFrame so the DOM is fully painted first.
 */
function _scrollBottom() {
  requestAnimationFrame(() => {
    const list = document.getElementById("msgList");
    if (list) list.scrollTop = list.scrollHeight;
  });
}


/* ─────────────────────────────────────────────────────────────
   TEXTAREA AUTO-RESIZE
───────────────────────────────────────────────────────────── */

/** Grows the textarea up to its CSS max-height. */
function _autoResize() {
  const ta = document.getElementById("msgInput");
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}


/* ─────────────────────────────────────────────────────────────
   MOBILE SIDEBAR DRAWER
───────────────────────────────────────────────────────────── */

/** Toggle the sidebar open/closed on mobile. */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const isOpen  = sidebar.classList.toggle("open");

  if (isOpen) {
    // Create translucent overlay so tapping outside closes the sidebar
    const ov = document.createElement("div");
    ov.className = "sidebar-overlay";
    ov.id        = "sidebarOverlay";
    ov.onclick   = _closeSidebar;
    document.body.appendChild(ov);
  } else {
    _removeSidebarOverlay();
  }
}

function _closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  _removeSidebarOverlay();
}

function _removeSidebarOverlay() {
  document.getElementById("sidebarOverlay")?.remove();
}


/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────────────────────────── */

let _toastTimer = null;

function _toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}


/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

/**
 * HTML-escape a string to prevent XSS.
 * Always call this before inserting untrusted text into innerHTML.
 */
function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Convert plain http/https URLs in already-escaped text to
 * clickable anchor tags.
 */
function _linkify(escapedText) {
  return escapedText.replace(
    /(https?:\/\/[^\s&]+)/g,
    (url) => `<a href="${url}" target="_blank" style="color:var(--neon)">${url}</a>`
  );
}

/**
 * Return a deterministic colour from PALETTE for a given SID.
 * Consistent across all clients for the same session.
 */
function _color(sid) {
  if (!sid) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < sid.length; i++) {
    hash = (hash * 31 + sid.charCodeAt(i)) & 0xffffffff;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
