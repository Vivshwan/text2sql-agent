import threading
import uuid
import os
from .core.db import open_readonly
from .core.schema import extract_schema_string, find_date_columns

class SessionState:
    def __init__(self, db_path: str, *, ephemeral: bool, meta: dict):
        self.id = str(uuid.uuid4())
        self.db_path = db_path
        self.ephemeral = ephemeral
        self.meta = meta
        self._conn = None
        self.lock = threading.Lock()

    def conn(self):
        if self._conn is None:
            self._conn = open_readonly(self.db_path)
        return self._conn

    def schema_string(self) -> str:
        return extract_schema_string(self.conn())

    def date_columns(self) -> list[str]:
        return find_date_columns(self.conn())

    def cleanup(self):
        if self._conn is not None:
            try: self._conn.close()
            except Exception: pass
        if self.ephemeral:
            try: os.remove(self.db_path)
            except OSError: pass

class SessionStore:
    def __init__(self):
        self._items = {}
        self._lock = threading.Lock()

    def add(self, s): 
        with self._lock: self._items[s.id] = s
        return s
    def get(self, sid): return self._items.get(sid)
    def remove(self, sid):
        with self._lock: s = self._items.pop(sid, None)
        if s: s.cleanup()
        return bool(s)

store = SessionStore()