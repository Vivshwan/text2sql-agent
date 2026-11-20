from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routes import router

app = FastAPI(title="Text-to-SQL Agent")

origins = [
    "http://localhost:5173",
    "https://text2sql-agent-7zu7.vercel.app",
]

# Add CORS middleware LAST so it is the outermost layer
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global handler to catch 500s and add CORS headers manually
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    headers = {}
    if origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=headers
    )

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok"}