from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router

app = FastAPI(title="Text-to-SQL Agent")

# Allow your live Vercel frontend and local dev
origins = [
    "http://localhost:5173",
    "https://text2sql-agent-7zu7.vercel.app", # Your exact Vercel URL
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