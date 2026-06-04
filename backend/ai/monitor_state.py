"""
Shared log queue and status tracker for the AI Training Monitor.
Used by both train.py (writer) and app.py (reader).
"""
import collections
import threading
from datetime import datetime

# Thread-safe lock for shared state
_lock = threading.Lock()

# In-memory log buffer (deque with max 200 entries)
_log_deque = collections.deque(maxlen=200)
_log_id_counter = 0

# Current training status
_current_status = "idle"
_current_cycle = 0


def log_message(msg, cycle_number=None):
    """
    Log a message: prints to stdout, appends to in-memory deque,
    and persists to TrainingLogLine table in SQLite.
    """
    global _log_id_counter

    print(msg)

    now = datetime.utcnow()

    with _lock:
        _log_id_counter += 1
        entry = {
            "id": _log_id_counter,
            "cycle_number": cycle_number if cycle_number is not None else _current_cycle,
            "message": msg,
            "timestamp": now.isoformat(),
        }
        _log_deque.append(entry)

    # Persist to DB (best-effort, don't crash training if DB is locked)
    try:
        from db.database import SessionLocal
        from db.monitor_models import TrainingLogLine

        db = SessionLocal()
        row = TrainingLogLine(
            cycle_number=entry["cycle_number"],
            message=msg,
            timestamp=now,
        )
        db.add(row)
        db.commit()
        db.close()
    except Exception:
        pass


import json
import os

STATE_FILE = os.path.join(os.path.dirname(__file__), "..", "monitor_state.json")

def _write_state(status, cycle):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump({"status": status, "cycle": cycle}, f)
    except:
        pass

def _read_state():
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r") as f:
                return json.load(f)
    except:
        pass
    return {"status": "idle", "cycle": 0}

def get_status():
    return _read_state().get("status", "idle")

def set_status(s):
    state = _read_state()
    _write_state(s, state.get("cycle", 0))

def get_cycle():
    return _read_state().get("cycle", 0)

def set_cycle(n):
    state = _read_state()
    _write_state(state.get("status", "idle"), n)

def get_logs():
    """Return latest 100 log entries from SQLite so API process can see them."""
    try:
        from db.database import SessionLocal
        from db.monitor_models import TrainingLogLine
        db = SessionLocal()
        rows = db.query(TrainingLogLine).order_by(TrainingLogLine.id.desc()).limit(100).all()
        db.close()
        
        # Reverse to chronological order
        rows.reverse()
        return [
            {
                "id": r.id,
                "cycle_number": r.cycle_number,
                "message": r.message,
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
            } for r in rows
        ]
    except Exception:
        return []
