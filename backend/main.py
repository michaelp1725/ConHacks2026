import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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


@app.post("/api/chat/stream")
def stream_chat(payload: ChatRequest) -> StreamingResponse:
    if rag_service is None:
        raise HTTPException(status_code=503, detail="RAG service is still initializing.")

    def _sse(event: str, data: object) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    def event_stream():
        try:
            prepared = rag_service.prepare_query(payload.query)
            chunks: list[str] = []
            for token in rag_service.stream_answer(prepared.prompt):
                chunks.append(token)
                yield _sse("token", {"token": token})

            final_answer = rag_service.finalize_answer("".join(chunks), prepared.citations)
            if final_answer != "".join(chunks):
                suffix = final_answer[len("".join(chunks)) :]
                if suffix:
                    yield _sse("token", {"token": suffix})

            citations = [
                {
                    "case_name": citation.case_name,
                    "url": citation.url,
                    "relevance_score": citation.relevance_score,
                }
                for citation in prepared.citations
            ]
            yield _sse("citations", {"citations": citations})
            yield _sse("done", {"done": True})
        except Exception as exc:
            yield _sse("error", {"message": str(exc)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
