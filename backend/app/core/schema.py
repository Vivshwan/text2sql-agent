import sqlite3
import re

def _tables(conn):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    return [r[0] for r in cur.fetchall()]

def extract_schema_string(conn: sqlite3.Connection) -> str:
    cur = conn.cursor()
    parts = []
    for t in _tables(conn):
        cur.execute(f'PRAGMA table_info("{t}")')
        rows = cur.fetchall()
        cols = [f"  {r[1]} {r[2]}" for r in rows]
        parts.append(f'TABLE "{t}" (\n' + ",\n".join(cols) + "\n)")
    return "\n\n".join(parts)

def find_date_columns(conn: sqlite3.Connection) -> list[str]:
    cur = conn.cursor()
    date_cols = []
    for t in _tables(conn):
        cur.execute(f'PRAGMA table_info("{t}")')
        for _, name, ctype, *_ in cur.fetchall():
            if any(tok in name.lower() for tok in ("date", "_at", "time", "day", "month", "year")):
                date_cols.append(name)
    return list(set(date_cols))