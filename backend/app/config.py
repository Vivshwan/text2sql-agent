import os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
ROW_LIMIT = int(os.getenv("ROW_LIMIT", "200"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "2"))
DB_PATH = os.getenv("DB_PATH", "data/ecommerce.db")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]