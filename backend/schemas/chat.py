from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question for the legal copilot.")


class Citation(BaseModel):
    case_name: str
    url: str
    relevance_score: float


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
