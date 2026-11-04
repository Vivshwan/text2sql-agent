import sqlglot
from sqlglot import exp
from ..config import ROW_LIMIT

_ALLOWED = (exp.Select, exp.Union, exp.Intersect, exp.Except)

def is_safe_select(sql: str) -> bool:
    try:
        for stmt in sqlglot.parse(sql, read="sqlite"):
            if stmt is None: continue
            if not isinstance(stmt, _ALLOWED): return False
            for forbidden in (exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create):
                if stmt.find(forbidden): return False
        return True
    except sqlglot.errors.ParseError:
        return False

def enforce_limit(sql: str) -> str:
    try:
        parsed = sqlglot.parse_one(sql, read="sqlite")
        if isinstance(parsed, exp.Select) and parsed.args.get("limit") is not None:
            return sql
    except Exception: pass
    return f"SELECT * FROM ({sql.rstrip(';')}) AS _wrapped LIMIT {ROW_LIMIT}"