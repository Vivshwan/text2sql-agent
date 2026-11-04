import base64, io
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from .llm import complete
from .prompts import build_answer_prompt

def _chart_png(columns, rows):
    if len(columns) != 2 or not rows or len(rows) > 25: return None
    df = pd.DataFrame(rows, columns=columns)
    fig, ax = plt.subplots(figsize=(6, 3.5))
    try:
        is_date = pd.to_datetime(df[columns[0]], errors="raise").notna().all()
        df[columns[0]] = pd.to_datetime(df[columns[0]])
        ax.plot(df[columns[0]], df[columns[1]], marker="o")
    except Exception:
        ax.bar(df[columns[0]].astype(str), df[columns[1]])
        plt.xticks(rotation=45, ha="right")
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=110)
    plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

def present(question: str, result: dict) -> dict:
    if result["error"]:
        return {"answer": f"Error: {result['error']}", "columns": [], "rows": [], "chart": None, "sql": result["sql"]}
    
    cols, rows = result["columns"], result["rows"]
    if not rows:
        ans = "No matching data was found."
    else:
        try:
            ans = complete(build_answer_prompt(question, result["sql"], rows, cols))
        except Exception:
            ans = f"Returned {len(rows)} row(s)."
            
    return {"answer": ans, "columns": cols, "rows": rows, "chart": _chart_png(cols, rows), "sql": result["sql"]}