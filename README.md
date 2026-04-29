# Refugee Law AI Copilot (ConHacks2026)

RAG assistant for Canadian refugee law using:
- FastAPI backend
- LangChain orchestration
- Snowflake vector retrieval
- Gemini generation + embeddings
- Next.js + Tailwind chat frontend

## Project Structure

- `backend/main.py`: FastAPI app and `/api/chat` endpoint
- `backend/services/rag.py`: startup-initialized LangChain + Snowflake retrieval service
- `backend/schemas/chat.py`: request/response models
- `frontend/`: Next.js chat UI with citation cards

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `GEMINI_API_KEY`
- `SNOWFLAKE_ACCOUNT`
- `SNOWFLAKE_USER`
- `SNOWFLAKE_PASSWORD`
- `SNOWFLAKE_TABLE`

Recommended to also set:
- `SNOWFLAKE_WAREHOUSE`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_ROLE`
- `SNOWFLAKE_TEXT_COLUMN`, `SNOWFLAKE_VECTOR_COLUMN`, `SNOWFLAKE_METADATA_COLUMN`
- `RAG_TOP_K`
- `NEXT_PUBLIC_API_BASE_URL`

## Backend Run

```bash
python -m venv .venv
# Activate venv, then:
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend Run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Contract

`POST /api/chat`

Request:

```json
{
  "query": "What is the legal test for X?"
}
```

Response:

```json
{
  "answer": "string",
  "citations": [
    {
      "case_name": "string",
      "url": "string",
      "relevance_score": 0.92
    }
  ]
}
```