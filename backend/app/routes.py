import os, shutil, tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from .sessions import store, SessionState
from .schemas import SessionMeta, AskRequest, AskResponse
from .config import DB_PATH
from .core.agent import run_query
from .core.presenter import present
from .core.ambiguity import check_ambiguity
from .core.ingest import csv_to_sqlite, db_file_to_session, excel_to_sqlite
from pydantic import BaseModel
import sqlite3
from fastapi import Depends
from .auth import hash_password, verify_password, create_access_token, get_current_user, USER_DB_PATH
router = APIRouter(prefix="/api")

def _session_meta(s: SessionState) -> SessionMeta:
    return SessionMeta(
        id=s.id, source=s.meta.get("source", "unknown"),
        table=s.meta.get("table"), row_count=s.meta.get("row_count"),
        columns=s.meta.get("columns", []), schema_text=s.schema_string(),
        date_columns=s.date_columns(),
    )

@router.post("/sessions/demo", response_model=SessionMeta)
def create_demo_session():
    if not os.path.exists(DB_PATH):
        raise HTTPException(500, f"Demo DB not found at {DB_PATH}")
    s = store.add(SessionState(DB_PATH, ephemeral=False, meta={"source": "demo"}))
    return _session_meta(s)

@router.post("/sessions", response_model=SessionMeta)
async def create_upload_session(file: UploadFile = File(...), table_name: str = Form(None)):
    filename = file.filename.lower()
    valid_exts = (".csv", ".db", ".sqlite", ".sqlite3", ".xlsx", ".xls")
    if not filename.endswith(valid_exts):
        raise HTTPException(400, f"Only {', '.join(valid_exts)} files are accepted.")
    
    # Save file temporarily
    suffix = os.path.splitext(filename)[1]
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    with tmp as f: 
        shutil.copyfileobj(file.file, f)
    
    try:
        if suffix == ".csv":
            info = csv_to_sqlite(tmp.name, table_name=table_name)
        elif suffix in (".xlsx", ".xls"):
            info = excel_to_sqlite(tmp.name)
        else:
            info = db_file_to_session(tmp.name)
            
        s = store.add(SessionState(
            info["db_path"], ephemeral=True,
            meta={
                "source": file.filename, 
                "table": info["table"], 
                "row_count": info["row_count"], 
                "columns": info["columns"]
            },
        ))
        return _session_meta(s)
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")
    finally:
        try:
            os.remove(tmp.name)
        except Exception:
            pass     

@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest, current_user: dict = Depends(get_current_user)):
    s = store.get(req.session_id)
    if not s: raise HTTPException(404, "Session expired.")

    if not req.clarification:
        amb = check_ambiguity(s.conn(), req.question)
        if amb:
            return AskResponse(status="needs_clarification", clarification_question=amb)

    with s.lock:
        raw = run_query(s.conn(), req.question, req.clarification or "")

    if raw["error"]:
        return AskResponse(status="error", sql=raw["sql"], error=raw["error"])

    presented = present(req.question, raw)
    return AskResponse(status="ok", **presented)

class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/auth/signup")
def signup(user: UserSignup):
    conn = sqlite3.connect(USER_DB_PATH)
    try:
        conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (user.name, user.email, hash_password(user.password))
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(400, "Email already registered")
    finally:
        conn.close()
    return {"message": "User created successfully"}

@router.post("/auth/login")
def login(user: UserLogin):
    conn = sqlite3.connect(USER_DB_PATH)
    conn.row_factory = sqlite3.Row
    db_user = conn.execute("SELECT * FROM users WHERE email = ?", (user.email,)).fetchone()
    conn.close()

    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    
    token = create_access_token(data={"sub": db_user["email"]})
    return {"access_token": token, "token_type": "bearer", "name": db_user["name"]}

@router.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"name": current_user["name"], "email": current_user["email"]}