from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question for the legal copilot.")
    history: list[HistoryMessage] = Field(default_factory=list)


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
