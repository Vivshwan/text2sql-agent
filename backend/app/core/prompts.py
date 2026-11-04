from .schema import extract_schema_string

FEW_SHOT = """
Q: How many rows are in the table?
SQL: SELECT COUNT(*) FROM "{table}";

Q: What are the top 3 categories by total count?
SQL: SELECT "{cat_col}", COUNT(*) AS n FROM "{table}" GROUP BY "{cat_col}" ORDER BY n DESC LIMIT 3;
"""

def build_sql_prompt(conn, question: str, clarification: str = "", error: str = "") -> str:
    schema = extract_schema_string(conn)
    # Basic table inference for few shot (just grabs first table for example)
    tables = [r[0] for r in conn.cursor().execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").fetchall()]
    tbl = tables[0] if tables else "data"
    
    examples = FEW_SHOT.format(table=tbl, cat_col="category")
    
    parts = [
        "Write ONE SELECT statement (SQLite dialect) answering the question.",
        "Use only tables and columns from the schema.",
        "SCHEMA:", schema, "", "EXAMPLES:", examples.strip(), ""
    ]
    if clarification: parts.append(f"CLARIFICATION: {clarification}\n")
    if error: parts.append(f"PREVIOUS ERROR: {error}\nFix it.\n")
    parts.append(f"Q: {question}\nSQL:")
    return "\n".join(parts)

def build_answer_prompt(question, sql, rows, columns) -> str:
    preview = [dict(zip(columns, r)) for r in rows[:20]]
    return f"Question: {question}\nSQL: {sql}\nRows: {preview}\n\nAnswer the question in one concise sentence using only this data."