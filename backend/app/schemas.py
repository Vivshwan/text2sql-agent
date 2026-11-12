from pydantic import BaseModel, Field
from typing import Optional, List, Any

class SessionMeta(BaseModel):
    id: str
    source: str
    table: Optional[str] = None
    row_count: Optional[int] = None
    columns: List[str] = []
    schema_text: str
    date_columns: List[str] = []
    cleanup_report: List[str] = []

class AskRequest(BaseModel):
    session_id: str
    question: str = Field(min_length=1, max_length=1000)
    clarification: Optional[str] = None

class AskResponse(BaseModel):
    status: str
    answer: Optional[str] = None
    sql: Optional[str] = None
    columns: List[str] = []
    rows: List[List[Any]] = []
    chart: Optional[str] = None
    clarification_question: Optional[str] = None
    error: Optional[str] = None