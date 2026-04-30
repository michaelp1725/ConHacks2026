from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas.chat import ChatRequest, ChatResponse, Citation
from backend.services.rag import SnowflakeRAGService

rag_service: SnowflakeRAGService | None = None
app = FastAPI(title="Refugee Law AI Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def startup_event() -> None:
    global rag_service
    rag_service = SnowflakeRAGService()


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    if rag_service is None:
        raise HTTPException(status_code=503, detail="RAG service is still initializing.")

    result = rag_service.query(payload.query)
    citations = [
        Citation(
            case_name=citation.case_name,
            url=citation.url,
            relevance_score=citation.relevance_score,
        )
        for citation in result.citations
    ]
    return ChatResponse(answer=result.answer, citations=citations)

