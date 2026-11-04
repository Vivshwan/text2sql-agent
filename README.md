# 🚀 DataQuery AI: Text-to-SQL Agent

DataQuery AI is a full-stack, AI-powered application that allows users to ask questions in plain English and get answers from their data. It automatically generates SQL, runs it securely, visualizes the results, and provides a downloadable table.

## ✨ Features

- **Multi-Format Data Ingestion:** Upload `.csv`, `.xlsx` (multi-sheet Excel), `.sqlite`, or `.db` files.
- **Intelligent Schema Grounding:** The AI automatically reads the database schema, including foreign keys, and joins tables when necessary.
- **Self-Correcting AI:** If the generated SQL fails, the agent catches the error and retries up to 2 times.
- **Safe Execution:** SQL is strictly validated using `sqlglot` to ensure only `SELECT` statements are run. Connections are read-only.
- **Data Visualization:** Automatically generates bar/line charts using Matplotlib for compatible data.
- **Ambiguity Handling:** Asks clarifying questions (e.g., "Did you mean order_date or delivery_date?").
- **User Authentication:** Secure JWT-based Signup and Login system with password hashing.
- **Modern UI:** A beautiful, DeepSeek-inspired dark mode interface built with React and Tailwind CSS.
- **Export Results:** Download query results as a `.csv` file with dynamic, keyword-based filenames.

---

## 🛠️ Tech Stack

**Backend:**
- **FastAPI** (Web framework)
- **Groq API** (LLM for SQL generation)
- **SQLGlot** (SQL parsing and security validation)
- **Pandas** (Data ingestion and processing)
- **SQLite** (Temporary session databases)
- **Passlib & Python-Jose** (Authentication and JWT)

**Frontend:**
- **React + Vite + TypeScript**
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)
- **React Syntax Highlighter** (SQL code display)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Groq API Key](https://console.groq.com/keys)

### 1. Backend Setup


Open a terminal and navigate to the backend folder:
```bash
cd backend
Create and activate a virtual environment:

bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

Install the dependencies:

bash
pip install -r requirements.txt

Create a .env file in the backend folder:

env
GROQ_API_KEY=gsk_your_actual_groq_key_here
LLM_MODEL=openai/gpt-oss-120b
ROW_LIMIT=200
MAX_RETRIES=2
DB_PATH=data/ecommerce.db
CORS_ORIGINS=http://localhost:5173
Generate the demo database:

bash
python -m app.setup_db
Start the FastAPI server:

bash
uvicorn app.main:app --reload --port 8000
The backend API docs will be available at http://127.0.0.1:8000/docs.

2. Frontend Setup
Open a new terminal and navigate to the frontend folder:

bash
cd frontend
Install dependencies:

bash
npm install
Start the development server:

bash
npm run dev
Open your browser and go to http://localhost:5173. You can now sign up, log in, upload data, and start asking questions!

📂 Project Structure
text
text2sql-agent/
├── backend/
│   ├── app/
│   │   ├── core/          # Agent logic, LLM, SQL validator, Presenter
│   │   ├── auth.py        # JWT & Password Hashing
│   │   ├── config.py      # Environment variables
│   │   ├── main.py        # FastAPI app entry point
│   │   ├── routes.py      # API endpoints
│   │   └── setup_db.py    # Script to generate demo DB
│   ├── data/              # SQLite databases (generated)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # DataTable, SqlBlock, AuthScreen
│   │   ├── App.tsx        # Main Chat UI
│   │   ├── AuthContext.tsx# Global Auth state
│   │   └── api.ts         # Fetch wrappers with JWT headers
│   ├── package.json
│   └── vite.config.ts     # Vite & Proxy configuration
└── README.md