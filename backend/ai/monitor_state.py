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


def get_status():
    """Return current training status string."""
    with _lock:
        return _current_status


def set_status(s):
    """Set current training status ('idle', 'self-play', 'training')."""
    global _current_status
    with _lock:
        _current_status = s


def get_cycle():
    """Return current cycle number."""
    with _lock:
        return _current_cycle


def set_cycle(n):
    """Set current cycle number."""
    global _current_cycle
    with _lock:
        _current_cycle = n


def get_logs():
    """Return a snapshot of all log entries in the deque."""
    with _lock:
        return list(_log_deque)
