from enum import Enum

from langchain_google_genai import ChatGoogleGenerativeAI


class QueryRoute(str, Enum):
    CASE_SEARCH = "CASE_SEARCH"
    LAW_SEARCH = "LAW_SEARCH"
    BOTH = "BOTH"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


_PROMPT = """\
You are a routing classifier for a Canadian refugee law assistant.

Classify the user query into exactly one category:
- CASE_SEARCH: Questions about RPD/RAD tribunal decisions, case outcomes, how tribunals ruled on specific situations, precedents, credibility findings
- LAW_SEARCH: Questions about what legislation says, statutory text, legal definitions, IRPA provisions, regulations
- BOTH: Questions that need both case law AND statutory text (e.g. how courts have interpreted a specific statute, what the law requires and how it has been applied in practice)
- OUT_OF_SCOPE: Not related to Canadian refugee or immigration law

If there is prior conversation history, use it only to understand short follow-up questions.

Reply with ONLY the category name. No explanation, no punctuation, no extra text.

{history_section}Query: {question}"""


class QueryClassifier:
    def __init__(self, llm: ChatGoogleGenerativeAI) -> None:
        self._llm = llm

    def classify(self, question: str, history: list[dict[str, str]] | None = None) -> QueryRoute:
        history_section = ""
        if history:
            recent = history[-4:]
            lines = "\n".join(f"{m['role'].capitalize()}: {m['content']}" for m in recent)
            history_section = f"Prior conversation:\n{lines}\n\n"

        raw = str(self._llm.invoke(_PROMPT.format(question=question, history_section=history_section)).content).strip().upper()
        try:
            route = QueryRoute(raw)
        except ValueError:
            route = QueryRoute.BOTH

        return route
