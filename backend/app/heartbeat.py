import re
import time

HEARTBEAT_TTL = 120
sessions: dict[str, dict] = {}


def record_heartbeat(session_id: str, url: str | None, contributor_id: str | None):
    prev = sessions.get(session_id, {})
    sessions[session_id] = {
        "last_seen": time.time(),
        "url": url or "",
        "contributor_id": contributor_id,
        "created_at": prev.get("created_at", time.time()),
    }


def verify_session(session_id: str) -> bool:
    session = sessions.get(session_id)
    if not session:
        return False
    if time.time() - session["last_seen"] > HEARTBEAT_TTL:
        sessions.pop(session_id, None)
        return False
    if not re.search(r"hattrick\.org", session.get("url", "")):
        return False
    return True


def cleanup_sessions():
    now = time.time()
    expired = [k for k, v in sessions.items() if now - v["last_seen"] > HEARTBEAT_TTL]
    for k in expired:
        sessions.pop(k, None)
