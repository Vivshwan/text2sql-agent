import pandas as pd
import numpy as np

def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Cleans a raw dataframe and returns the cleaned df + a list of actions taken."""
    actions_taken = []
    
    # 1. Remove entirely empty rows and columns
    df = df.dropna(how="all").dropna(axis=1, how="all")
    
    # 2. Strip whitespace from string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace('nan', np.nan)
        
    # 3. Remove duplicate rows
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        df = df.drop_duplicates()
        actions_taken.append(f"Removed {duplicates} duplicate rows.")
        
    # 4. Handle Missing Values & Type Casting
    for col in df.columns:
        # FORCE TO STRING: Prevent pandas from ruining Zip Codes / Phone Numbers (e.g., 01234 -> 1234)
        if any(keyword in col.lower() for keyword in ['zip', 'phone', 'id', 'code']):
            if df[col].dtype != 'object':
                df[col] = df[col].apply(lambda x: str(int(x)) if pd.notnull(x) and isinstance(x, (int, float)) else x)
                actions_taken.append(f"Forced '{col}' to text format to prevent data loss (e.g., leading zeros).")

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
        if df[col].dtype == 'object':
            # Skip if it's one of the forced string columns
            if any(keyword in col.lower() for keyword in ['zip', 'phone', 'id', 'code']):
                continue
                
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