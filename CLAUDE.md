# CLAUDE.md — Legal Assistant Hackathon Project

## Project Overview
A RAG-based legal assistant focused on **Canadian refugee law** (RPD/RAD cases). Users describe
their legal situation in plain language and receive a grounded, cited explanation with relevant
case law, evidence checklists, and next steps. This is NOT legal advice — it is structured legal
information.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| RAG Pipeline | LangChain + Snowflake Cortex Search |
| Vector Store | Snowflake (`REFUGEE_CASE_CHUNKS` table) |
| Search Service | Snowflake Cortex Search (`REFUGEE_SEARCH`) |
| LLM | Gemini |

---

## System Architecture
```
User → Next.js Frontend
     → FastAPI Backend (/ask endpoint)
     → LangChain RAG Pipeline
        → Snowflake Cortex Search (semantic retrieval)
        → Retrieved document chunks
     → Gemini (grounded generation)
     → Structured JSON response
     → Frontend display
```

---

## Data Sources
- A2AJ Canadian case law dataset (`a2aj/canadian-case-law` on HuggingFace)
- Filtered to **RPD** (Refugee Protection Division) and **RAD** (Refugee Appeal Division) only
- ~20,851 cases → ~1,250,499 chunks after processing

---

## Snowflake Schema
**Database:** `LEGAL_RAG_DB` | **Schema:** `PUBLIC`

```sql
TABLE REFUGEE_CASE_CHUNKS (
    ID        VARCHAR,       -- uuid per chunk
    TEXT      VARCHAR,       -- chunk text (512 chars, 50 overlap)
    METADATA  VARIANT,       -- JSON: citation, url, document_date, dataset
    EMBEDDING VECTOR(FLOAT, 768)  -- pre-computed, not used by Cortex Search
)
```

**Cortex Search Service:** `REFUGEE_SEARCH` — indexes `TEXT`, returns `METADATA_STR` (METADATA cast to VARCHAR).

---

## Data Pipeline
All scripts run from the **project root**.

```
data/
  pipeline.py          # runs full pipeline: prepare → chunk → load
  test_search.py       # smoke test for Cortex Search
  scripts/
    prepare_dataset.py # download from HuggingFace, filter RPD/RAD, save parquet
    chunk.py           # split into 512-char chunks, save parquet
    load_snowflake.py  # upload to Snowflake, generate embeddings, create Cortex Search
  parquets/
    refugee_clean.parquet
    chunks.parquet
```

Run full pipeline:
```bash
python data/pipeline.py
```

---

## Structured Response Format
Every response from the backend must include:
- `explanation` — plain-language summary of the legal issue
- `cases` — relevant case law
- `checklist` — evidence the user should gather
- `next_steps` — actionable recommendations
- `citations` — source links for all claims
- `disclaimer` — "This is not legal advice"

---

## Key Constraints (Critical)
- Gemini **must only use retrieved documents** — no generating from parametric knowledge
- Every claim **must be cited** with a source
- No hallucinations — grounding enforcement is a core feature, not optional

---

## File Structure
```
/
├── frontend/         # Next.js app
├── backend/          # FastAPI app (not yet built)
│   ├── main.py
│   ├── routes/
│   ├── rag/          # LangChain pipeline
│   └── prompts/      # Gemini prompt templates
├── data/             # Data pipeline (see above)
└── CLAUDE.md
```

---

## Current Status
- [x] Data sourced and cleaned (RPD/RAD from A2AJ)
- [x] Chunked with LangChain RecursiveCharacterTextSplitter
- [x] Snowflake loaded with embeddings
- [x] Cortex Search service created and tested
- [ ] `/ask` endpoint working
- [ ] LangChain + Gemini integrated
- [ ] Frontend connected to backend
- [ ] Demo flow tested end-to-end
