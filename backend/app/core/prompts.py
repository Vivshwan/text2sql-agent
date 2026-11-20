from .schema import extract_schema_string

def build_sql_prompt(conn, question: str, history: list, clarification: str = "", error: str = "") -> str:
    # conn is now the sqlite3.Connection passed from run_query
    schema = extract_schema_string(conn)
    
    parts = [
        "You are an expert SQLite data analyst. Write ONE SELECT statement answering the user's question.",
        "Use only tables and columns from the schema. Do not invent columns.",
        "Quote table and column names with double quotes if they are reserved words.",
        "",
        "SCHEMA:",
        schema,
        "",
    ]
    
    if history:
        parts.append("--- CONVERSATION HISTORY ---")
        for msg in history[-6:]:
            if msg.get("role") == "user":
                parts.append(f"User: {msg.get('content')}")
            elif msg.get("role") == "assistant" and msg.get("sql"):
                parts.append(f"Assistant SQL: {msg.get('sql')}")
        parts.append("--- END HISTORY ---\n")

    if clarification: 
        parts.append(f"CLARIFICATION FROM USER: {clarification}\n")
    if error: 
        parts.append(f"PREVIOUS ERROR: {error}\nFix it.\n")
        
    parts.append(f"Q: {question}")
    parts.append("SQL:")
    return "\n".join(parts)

def build_answer_prompt(question, sql, rows, columns) -> str:
    preview = [dict(zip(columns, r)) for r in rows[:20]]
    return (
        f"Question: {question}\n"
        f"SQL: {sql}\n"
        f"Rows: {preview}\n\n"
        "Answer the question in one concise sentence using only the data above. "
        "Do not invent numbers. If the result is empty, say no matching data was found."
    )