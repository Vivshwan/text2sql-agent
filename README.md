# Text2SQL Agent

Text2SQL Agent is a web app for exploring data with natural-language questions. Sign in, connect the included demo database or upload your own data, and ask questions in a chat interface. The backend uses a Groq-hosted language model to generate SQLite queries, checks that generated queries are read-only, and returns results for display as tables and charts.

## Features

- Sign up and log in with email and password.
- Connect to the included e-commerce demo database.
- Upload CSV, Excel (`.xlsx` or `.xls`), and SQLite (`.db`, `.sqlite`, or `.sqlite3`) files.
- Ask follow-up questions and respond to clarification prompts.
- View generated SQL and query results; supported results can also be visualized as charts.
- Restrict generated queries to `SELECT` statements and limit returned rows.

## Requirements

- Python 3.10 or later
- Node.js and npm
- A Groq API key for natural-language query generation

## Run locally

### 1. Configure the backend

In `backend/.env`, set your Groq API key:

```dotenv
GROQ_API_KEY=your_groq_api_key
```

The backend loads this file when started from the `backend` directory. Do not commit real API keys.

The following optional settings are also supported:

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Groq model used to generate SQL |
| `ROW_LIMIT` | `200` | Maximum number of result rows |
| `MAX_RETRIES` | `2` | Number of SQL-generation retries after the first attempt |
| `DB_PATH` | `data/ecommerce.db` | Path to the demo SQLite database, relative to the backend working directory |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed browser origins |

### 2. Install backend dependencies and start the API

From the project root, create and activate a virtual environment, install dependencies, and run the FastAPI server:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`; the health check is `http://localhost:8000/health`.

### 3. Install frontend dependencies and start the web app

In a second terminal, from the project root:

```powershell
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (by default, `http://localhost:5173`). The Vite development server proxies `/api` requests to the backend at `http://127.0.0.1:8000`.

## Using the app

1. Create an account and sign in.
2. Select **Load Demo DB** or upload a supported file.
3. Ask a question about the connected data, such as “How many orders are there by status?”
4. If the app asks for clarification, provide an answer to continue.
5. Review the generated SQL, answer, and any returned table or chart.

The demo database contains `customers`, `products`, `orders`, and `order_items` tables. Uploaded CSV and Excel files are imported into temporary SQLite databases for the session; each Excel sheet becomes a table. Uploaded SQLite databases are copied to a temporary session location.

## API overview

The backend exposes these endpoints under `/api`:

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create an account |
| `POST` | `/auth/login` | Log in and receive a bearer token |
| `GET` | `/auth/me` | Return the current authenticated user |
| `POST` | `/sessions/demo` | Start a session with the demo database |
| `POST` | `/sessions` | Start a session from an uploaded file |
| `POST` | `/ask` | Ask a question about a session (requires a bearer token) |

## Project layout

```text
backend/
  app/
    core/       SQL generation, validation, data import, and result presentation
    main.py     FastAPI application
    routes.py   API endpoints
    setup_db.py Script to regenerate the demo database
  data/         Demo and local user SQLite databases
  requirements.txt
frontend/
  src/          React application and UI components
  package.json
```

## Regenerate the demo database

If the demo database is missing, run this from the `backend` directory:

```powershell
python -m app.setup_db
```

**This script deletes and recreates the database at the configured `DB_PATH`.** Back up that file first if it contains data you need.
