from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question for the legal copilot.")


class Citation(BaseModel):
    case_name: str
    url: str
    relevance_score: float
    source_type: str  # "case" or "law"
    label: str  # "S1", "S2", etc.


class ChatResponse(BaseModel):
    explanation: str
    checklist: list[str]
    next_steps: list[str]
    disclaimer: str
    citations: list[Citation]
    route: str
