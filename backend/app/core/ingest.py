import os
import re
import sqlite3
import tempfile
import pandas as pd
import numpy as np

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

def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Cleans a raw dataframe and returns the cleaned df + a list of actions taken."""
    actions_taken = []
    
    # 1. Remove entirely empty rows and columns
    df = df.dropna(how="all").dropna(axis=1, how="all")
    
    # 2. Strip whitespace from string columns and replace "NaN" strings
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace('nan', np.nan)
        
    # 3. Remove duplicate rows
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        df = df.drop_duplicates()
        actions_taken.append(f"Removed {duplicates} duplicate rows.")
        
    # 4. Handle Missing Values
    for col in df.columns:
        missing_count = df[col].isna().sum()
        if missing_count == 0:
            continue
            
        missing_pct = missing_count / len(df)
        
        # If more than 60% is missing, drop the column
        if missing_pct > 0.6:
            df = df.drop(columns=[col])
            actions_taken.append(f"Dropped column '{col}' because it was {missing_pct*100:.1f}% empty.")
            continue
            
        # If numeric, fill with median
        if pd.api.types.is_numeric_dtype(df[col]):
            median = df[col].median()
            df[col] = df[col].fillna(median)
            actions_taken.append(f"Filled missing numeric values in '{col}' with median.")
            
        # If string/categorical, fill with "Unknown"
        else:
            df[col] = df[col].fillna("Unknown")
            actions_taken.append(f"Filled missing text values in '{col}' with 'Unknown'.")

    # 5. Try to convert string dates to actual SQLite dates
    for col in df.columns:
        if df[col].dtype == 'object' or str(df[col].dtype) == 'string':
            try:
                sample = df[col].dropna().head(50)
                if len(sample) > 0:
                    parsed = pd.to_datetime(sample, errors='coerce')
                    if parsed.notna().sum() >= len(sample) * 0.8:
                        df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
                        actions_taken.append(f"Standardized '{col}' to Date format (YYYY-MM-DD).")
            except Exception:
                pass
                
    return df, actions_taken

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

    # CLEAN DATA
    df, cleanup_report = clean_dataframe(df)

    # Infer types (Numeric fallback)
    for col in df.columns:
        numeric = pd.to_numeric(df[col], errors="coerce")
        if numeric.notna().sum() >= max(1, int(0.8 * df[col].notna().sum())) and df[col].notna().sum() > 0:
            df[col] = numeric
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

    return {
        "db_path": db_path, 
        "table": table_name, 
        "row_count": len(df), 
        "columns": df.columns.tolist(),
        "cleanup_report": cleanup_report
    }

def excel_to_sqlite(xlsx_path: str, db_path: str | None = None) -> dict:
    if db_path is None:
        fd, db_path = tempfile.mkstemp(prefix="excelsession_", suffix=".db")
        os.close(fd)

    conn = sqlite3.connect(db_path)
    first_table = None
    total_rows = 0
    all_cleanup_reports = []

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

            # CLEAN DATA
            df, report = clean_dataframe(df)
            if report:
                all_cleanup_reports.append(f"[Sheet: {sheet_name}] " + "; ".join(report))

            table_name = _safe_ident(sheet_name)
            df.to_sql(table_name, conn, if_exists="replace", index=False)
            
            if first_table is None:
                first_table = table_name
            total_rows += len(df)

    conn.close()
    return {
        "db_path": db_path, 
        "table": first_table, 
        "row_count": total_rows, 
        "columns": [], 
        "cleanup_report": all_cleanup_reports
    }

def db_file_to_session(uploaded_file_path: str) -> dict:
    """Takes an uploaded SQLite .db file, validates it, and copies it to a temporary session location."""
    import shutil

    fd, temp_db_path = tempfile.mkstemp(prefix="dbsession_", suffix=".db")
    os.close(fd)
    shutil.copy2(uploaded_file_path, temp_db_path)

    try:
        conn = sqlite3.connect(f"file:{temp_db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [r[0] for r in cur.fetchall()]
        
        if not tables:
            raise ValueError("The uploaded database contains no tables.")
        
        first_table = tables[0]
        cur.execute(f'SELECT COUNT(*) FROM "{first_table}"')
        row_count = cur.fetchone()[0]
        conn.close()

        return {
            "db_path": temp_db_path, 
            "table": first_table, 
            "row_count": row_count, 
            "columns": [],
            "cleanup_report": ["Database file loaded directly (no preprocessing applied)."]
        }
    except Exception as e:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
        raise ValueError(f"Invalid SQLite database: {str(e)}")