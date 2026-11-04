from .schema import find_date_columns

TIME_KW = ["last month", "this month", "last week", "this week", "yesterday", "today", "last year", "this year"]

def check_ambiguity(conn, question: str) -> str | None:
    if any(kw in question.lower() for kw in TIME_KW):
        dates = find_date_columns(conn)
        if len(dates) >= 2:
            return f"Which date column should define the time period: {', '.join(dates)}?"
    return None