import os
import re
import sqlite3
import tempfile
import pandas as pd

DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S")

def _safe_ident(name: str) -> str:
    name = re.sub(r"[^0-9a-zA-Z_]+", "_", str(name).strip()).strip("_").lower()
    if not name: name = "col"
    if name[0].isdigit(): name = "c_" + name
    return name

def _try_parse_dates(series: pd.Series):
    if not pd.api.types.is_object_dtype(series): return None
    sample = series.dropna().astype(str).head(50)
    if len(sample) == 0: return None
    for fmt in DATE_FORMATS:
        try:
            return pd.to_datetime(series, format=fmt, errors="coerce")
        except Exception:
            continue
    return None

def csv_to_sqlite(csv_path: str, db_path: str | None = None, table_name: str | None = None) -> dict:
    df = pd.read_csv(csv_path, encoding="utf-8-sig")
    if df.empty: raise ValueError("CSV is empty")
    
    # Normalize columns
    seen = {}
    new_cols = []
    for col in df.columns:
        safe = _safe_ident(col)
        if safe in seen:
            seen[safe] += 1
            safe = f"{safe}_{seen[safe]}"
        else:
            seen[safe] = 0
        new_cols.append(safe)
    df.columns = new_cols

    # Infer types
    for col in df.columns:
        numeric = pd.to_numeric(df[col], errors="coerce")
        if numeric.notna().sum() >= max(1, int(0.8 * df[col].notna().sum())) and df[col].notna().sum() > 0:
            df[col] = numeric
            continue
        dates = _try_parse_dates(df[col])
        if dates is not None and dates.notna().sum() >= max(1, int(0.8 * df[col].notna().sum())):
            df[col] = dates.dt.strftime("%Y-%m-%d")
            continue
        df[col] = df[col].astype("string")

    if table_name is None:
        table_name = _safe_ident(os.path.splitext(os.path.basename(csv_path))[0])
    table_name = _safe_ident(table_name)

    if db_path is None:
        fd, db_path = tempfile.mkstemp(prefix="csvsession_", suffix=".db")
        os.close(fd)

    conn = sqlite3.connect(db_path)
    df.to_sql(table_name, conn, if_exists="replace", index=False)
    conn.close()

    return {"db_path": db_path, "table": table_name, "row_count": len(df), "columns": df.columns.tolist()}

def db_file_to_session(uploaded_file_path: str) -> dict:
    """
    Takes an uploaded SQLite .db file, validates it, and copies it 
    to a temporary session location.
    """
    import shutil
    import tempfile
    import sqlite3

    # Create a temp path for this session
    fd, temp_db_path = tempfile.mkstemp(prefix="dbsession_", suffix=".db")
    os.close(fd)

    # Copy the uploaded file to our session temp path
    shutil.copy2(uploaded_file_path, temp_db_path)

    # Test connection and fetch table info
    try:
        conn = sqlite3.connect(f"file:{temp_db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [r[0] for r in cur.fetchall()]
        
        if not tables:
            raise ValueError("The uploaded database contains no tables.")
        
        # Grab row count of the first table just as a reference
        first_table = tables[0]
        cur.execute(f'SELECT COUNT(*) FROM "{first_table}"')
        row_count = cur.fetchone()[0]
        conn.close()

        return {
            "db_path": temp_db_path, 
            "table": first_table, 
            "row_count": row_count, 
            "columns": [] # Empty because DBs can have multiple tables with different columns
        }
    except Exception as e:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
        raise ValueError(f"Invalid SQLite database: {str(e)}")
    
def excel_to_sqlite(xlsx_path: str, db_path: str | None = None) -> dict:
    """Loads every sheet in an Excel file into a SQLite DB as separate tables."""
    import tempfile
    import sqlite3
    import pandas as pd

    if db_path is None:
        fd, db_path = tempfile.mkstemp(prefix="excelsession_", suffix=".db")
        os.close(fd)

    conn = sqlite3.connect(db_path)
    first_table = None
    total_rows = 0

    # Using `with` ensures the file is closed immediately, preventing Windows PermissionError
    with pd.ExcelFile(xlsx_path) as xls:
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            seen = {}
            new_cols = []
            for col in df.columns:
                safe = _safe_ident(col)
                if safe in seen:
                    seen[safe] += 1
                    safe = f"{safe}_{seen[safe]}"
                else:
                    seen[safe] = 0
                new_cols.append(safe)
            df.columns = new_cols

            table_name = _safe_ident(sheet_name)
            df.to_sql(table_name, conn, if_exists="replace", index=False)
            
            if first_table is None:
                first_table = table_name
            total_rows += len(df)

    conn.close()
    return {"db_path": db_path, "table": first_table, "row_count": total_rows, "columns": []}