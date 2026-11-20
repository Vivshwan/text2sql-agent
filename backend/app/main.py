from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router
from .config import CORS_ORIGINS

app = FastAPI(title="Text-to-SQL Agent")

# Explicitly list your Vercel frontend URL(s)
# If you have multiple (e.g., preview deployments), add them here
origins = [
    "http://localhost:5173",  # For local development
    "https://text2sql-agent-7zu7.vercel.app",  # Your live Vercel frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok"}