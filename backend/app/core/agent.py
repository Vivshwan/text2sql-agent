import re
from .llm import complete
from .prompts import build_sql_prompt
from .validator import is_safe_select, enforce_limit
from ..config import MAX_RETRIES

def _extract_sql(text: str) -> str:
    text = re.sub(r"```sql|```", "", text, flags=re.IGNORECASE).strip()
    if text.lower().startswith("sql:"): text = text[4:].strip()
    if ";" in text: text = text.split(";")[0] + ";"
    return text.strip()

def run_query(conn, question: str, clarification: str = "") -> dict:
    error_ctx = ""
    for attempt in range(MAX_RETRIES + 1):
        prompt = build_sql_prompt(conn, question, clarification, error_ctx)
        sql = _extract_sql(complete(prompt))

        if not is_safe_select(sql):
            error_ctx = "Rejected: only SELECT statements are allowed."
            continue

        safe_sql = enforce_limit(sql)
        try:
            cur = conn.cursor()
            cur.execute(safe_sql)
            columns = [d[0] for d in cur.description]
            rows = [tuple(r) for r in cur.fetchall()]
            return {"sql": safe_sql, "columns": columns, "rows": rows, "error": None, "attempts": attempt + 1}
        except Exception as e:
            error_ctx = f"{type(e).__name__}: {e}"

    return {"sql": sql, "columns": [], "rows": [], "error": error_ctx or "Failed.", "attempts": MAX_RETRIES + 1}