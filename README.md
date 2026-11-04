# DataQuery AI: Text-to-SQL Agent

DataQuery AI is a full-stack application for asking questions about data in plain English. It uses a Groq-hosted language model to generate SQLite queries, runs eligible queries against a connected database, and displays the results in a chat interface with optional charts and CSV export.

## Features

- **Data uploads:** Import CSV, multi-sheet Excel (`.xlsx`), and SQLite (`.sqlite`, `.sqlite3`, or `.db`) files.
- **Schema-aware SQL generation:** The backend reads table and column names and includes the schema in the prompt used to generate SQL.
- **Query retries:** If generated SQL fails validation or execution, the agent can retry up to the configured number of times.
- **Read-only query execution:** Generated statements are checked with SQLGlot and database connections are opened read-only.
- **Charts and CSV export:** Display compatible query results as charts and download result tables as CSV files.
- **Clarification prompts:** Ask follow-up questions when the request may be ambiguous.
- **Accounts:** Sign up and log in with password hashing and bearer-token authentication.
- **Demo database:** Explore sample e-commerce customers, products, orders, and order items.

## Tech stack

| Area | Technologies |
| --- | --- |
| Backend | Python, FastAPI, Groq API, SQLGlot, Pandas, SQLite |
| Authentication | Passlib, Python-Jose, JWT |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| UI libraries | Lucide React, React Syntax Highlighter |
| Charts | Matplotlib |

## Requirements

- Python 3.10 or later
- Node.js and npm
- A [Groq API key](https://console.groq.com/keys)

## Getting started

### 1. Configure and run the backend

From the project root, change to the backend directory:

```powershell
cd backend
```

Create and activate a virtual environment, then install the Python dependencies:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

On macOS or Linux, activate the environment with:

```bash
source venv/bin/activate
```

Create `backend/.env` and add your Groq API key. The remaining values are optional:

```dotenv
GROQ_API_KEY=your_actual_groq_api_key
LLM_MODEL=llama-3.3-70b-versatile
ROW_LIMIT=200
MAX_RETRIES=2
DB_PATH=data/ecommerce.db
CORS_ORIGINS=http://localhost:5173
```

`MAX_RETRIES=2` allows up to two retries after the initial attempt. `LLM_MODEL` must be a model available to your Groq account. Keep `.env` and API keys private.

The demo database is included in `backend/data/ecommerce.db`. If it is missing, generate it from the `backend` directory:

```powershell
python -m app.setup_db
```

**Running this script deletes and recreates the database at `DB_PATH`. Back it up first if it contains data you need.**

Start the API from the `backend` directory:

```powershell
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://127.0.0.1:8000`. Interactive documentation is available at `http://127.0.0.1:8000/docs`, and the health check is at `http://127.0.0.1:8000/health`.

### 2. Run the frontend

Open a second terminal at the project root and run:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies API requests to `http://127.0.0.1:8000`.

## Using the app

1. Sign up and log in.
2. Choose **Load Demo DB** or upload a supported file.
3. Ask a question about the connected data.
4. Answer a clarification prompt if one appears.
5. Review the generated SQL, answer, results table, and any chart. Use **Export CSV** to download the results.

CSV uploads are imported as a table, and each Excel sheet is imported as a separate table. Uploaded databases are copied for the session and queried through a read-only connection.

## API endpoints

All application endpoints are under `/api`:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account |
| `POST` | `/api/auth/login` | Log in and receive a bearer token |
| `GET` | `/api/auth/me` | Get the current authenticated user |
| `POST` | `/api/sessions/demo` | Create a session using the demo database |
| `POST` | `/api/sessions` | Upload a file and create a data session |
| `POST` | `/api/ask` | Ask a question about a session; requires authentication |

## Project structure

```text
text2sql-agent/
├── backend/
│   ├── app/
│   │   ├── core/                 # SQL generation, validation, imports, and result presentation
│   │   ├── auth.py               # Password hashing and JWT authentication
│   │   ├── config.py             # Environment-based configuration
│   │   ├── main.py               # FastAPI application
│   │   ├── routes.py             # API endpoints
│   │   └── setup_db.py           # Demo database generator
│   ├── data/                     # Demo and local user SQLite databases
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Data table, SQL display, and authentication UI
│   │   ├── App.tsx               # Main chat interface
│   │   ├── AuthContext.tsx        # Frontend authentication state
│   │   └── api.ts                # API request helpers
│   ├── package.json
│   └── vite.config.ts            # Development server and API proxy
└── README.md
```

## Deployment note

This project is configured for local development. Before exposing it to users, configure a strong, private JWT signing key (the current signing key is hard-coded in `backend/app/auth.py`), review authentication and upload limits, and use an appropriately secured deployment configuration.
