# DataQuery AI: Text-to-SQL Agent

DataQuery AI is a full-stack application for asking questions about data in plain English. It uses a Groq-hosted language model to generate SQLite queries, runs eligible queries against a connected database, and displays the results in a chat interface with optional charts and CSV export.

## Features

- **Data uploads:** Import CSV, multi-sheet Excel (`.xlsx`), and SQLite (`.sqlite`, `.sqlite3`, or `.db`) files. The upload endpoint also accepts `.xls`; legacy Excel files may require the `xlrd` package, which is not included in the requirements.
- **Schema-aware SQL generation:** The backend reads table and column names and includes the schema in the prompt used to generate SQL.
- **Query retries:** If generated SQL fails validation or execution, the agent can retry up to the configured number of times.
- **Read-only query execution:** Generated statements are checked with SQLGlot and database connections are opened read-only.
- **Charts and CSV export:** Display charts for compatible results (two columns and no more than 25 rows) and download result tables as CSV files.
- **Clarification prompts:** Ask follow-up questions when the request may be ambiguous.
- **Demo database:** Explore sample e-commerce customers, products, orders, and order items.

## Tech stack

| Area | Technologies |
| --- | --- |
| Backend | Python, FastAPI, Groq API, SQLGlot, Pandas, SQLite |
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

`MAX_RETRIES=2` allows up to two retries after the initial attempt. `ROW_LIMIT` is the maximum number of rows returned by a generated query. `LLM_MODEL` must be a model available to your Groq account. Keep `.env` and API keys private.

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

The frontend opens at `http://localhost:5173`. Its API base URL is currently set in `frontend/src/api.ts` to the hosted service `https://text2sql-agent-8pia.onrender.com`; Vite does not proxy API requests. To use the local backend started above, change `API_BASE` in that file to `http://127.0.0.1:8000`.

## Using the app

1. Choose **Load Demo DB** or upload a supported file.
2. Ask a question about the connected data.
3. Answer a clarification prompt if one appears.
4. Review the generated SQL, answer, results table, and any chart. Use **Export CSV** to download the results.

CSV uploads are imported as one table (an optional `table_name` form field can set its name), and each Excel sheet is imported as a separate table. Uploaded SQLite databases are copied for the session. All session databases are queried through read-only connections.

## API endpoints

Application endpoints are under `/api`:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/sessions/demo` | Create a session using the demo database |
| `POST` | `/api/sessions` | Upload a file and create a data session (`multipart/form-data`) |
| `POST` | `/api/ask` | Ask a question about a session |

The backend also exposes `GET /health`; FastAPI's interactive API documentation is at `/docs`.

## Project structure

```text
text2sql-agent/
├── backend/
│   ├── app/
│   │   ├── core/                 # SQL generation, validation, imports, and result presentation
│   │   ├── config.py             # Environment-based configuration
│   │   ├── main.py               # FastAPI application
│   │   ├── routes.py             # API endpoints
│   │   ├── schemas.py            # Request and response models
│   │   ├── sessions.py           # In-memory data-session store
│   │   └── setup_db.py           # Demo database generator
│   ├── data/                     # Demo SQLite database
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Data table and SQL display
│   │   ├── App.tsx               # Main chat interface
│   │   ├── api.ts                # API request helpers and API base URL
│   │   └── types.ts              # Frontend API types
│   ├── package.json
│   └── vite.config.ts            # Vite development server
└── README.md
```

## Deployment note

The API currently has no authentication, and the upload route does not set an upload-size limit. Do not expose it publicly without adding appropriate access controls and resource limits. Configure `CORS_ORIGINS` for the deployed frontend, set `API_BASE` in `frontend/src/api.ts` to the deployed backend, and keep the Groq API key on the server.
