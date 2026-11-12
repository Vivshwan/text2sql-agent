import threading
import uuid
import os
import time
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
        self.last_accessed = time.time() # <-- Track last time used

    def conn(self):
        if self._conn is None:
            self._conn = open_readonly(self.db_path)
        self.last_accessed = time.time() # <-- Update on every request
        return self._conn

    def schema_string(self) -> str:
        return extract_schema_string(self.conn())

    def date_columns(self) -> list[str]:
        return find_date_columns(self.conn())

    def cleanup(self):
        if self._conn is not None:
            try: self._conn.close()
            except Exception: pass
            self._conn = None
        if self.ephemeral:
            try: os.remove(self.db_path)
            except OSError: pass

class SessionStore:
    def __init__(self):
        self._items = {}
        self._lock = threading.Lock()
        self._start_cleanup_thread() # <-- Start background cleaner

    def add(self, s): 
        with self._lock: self._items[s.id] = s
        return s
    
    def get(self, sid): 
        s = self._items.get(sid)
        if s: s.last_accessed = time.time()
        return s
        
    def remove(self, sid):
        with self._lock: s = self._items.pop(sid, None)
        if s: s.cleanup()
        return bool(s)
        
    def _start_cleanup_thread(self):
        """Runs in the background to delete temp databases older than 1 hour."""
        def cleanup_worker():
            while True:
                time.sleep(600) # Check every 10 minutes
                current_time = time.time()
                stale_ids = []
                
                for sid, s in self._items.items():
                    # If it hasn't been accessed in 60 minutes (3600 seconds), delete it
                    if current_time - s.last_accessed > 3600:
                        stale_ids.append(sid)
                        
                for sid in stale_ids:
                    print(f"[Session Cleanup] Deleting stale session: {sid}")
                    self.remove(sid)
                    
        t = threading.Thread(target=cleanup_worker, daemon=True)
        t.start()

store = SessionStore()