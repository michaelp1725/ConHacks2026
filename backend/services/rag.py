import os
from dataclasses import dataclass
import json

import snowflake.connector
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI


SYSTEM_PROMPT = PromptTemplate.from_template(
    """You are a legal research assistant for Canadian refugee law.
Answer ONLY using the context below.

Rules:
1) Do not use outside knowledge.
2) If context is insufficient, say: "I do not have enough information in the provided cases."
3) Keep answers concise and professional.
4) Prefer citing relevant case names in your explanation when possible.

Context:
{context}

Question:
{question}

Answer:"""
)


@dataclass
class RetrievedCitation:
    case_name: str
    url: str
    relevance_score: float


@dataclass
class RAGResult:
    answer: str
    citations: list[RetrievedCitation]


class SnowflakeRAGService:
    """Startup-initialized RAG service backed by Snowflake Cortex Search."""

    def __init__(self) -> None:
        load_dotenv()
        self._ensure_env()

        self.llm = ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=os.environ["GEMINI_API_KEY"],
            temperature=0,
        )

        self.connection = snowflake.connector.connect(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user=os.environ["SNOWFLAKE_USER"],
            password=os.environ["SNOWFLAKE_PASSWORD"],
            warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
            database=os.getenv("SNOWFLAKE_DATABASE"),
            schema=os.getenv("SNOWFLAKE_SCHEMA"),
            role=os.getenv("SNOWFLAKE_ROLE"),
        )

        self.cortex_search_service = os.environ["SNOWFLAKE_CORTEX_SEARCH_SERVICE"]
        self.content_field = os.getenv("SNOWFLAKE_CORTEX_CONTENT_FIELD", "TEXT")
        self.case_name_field = os.getenv("SNOWFLAKE_CORTEX_CASE_NAME_FIELD", "case_name")
        self.source_url_field = os.getenv("SNOWFLAKE_CORTEX_SOURCE_URL_FIELD", "source_url")
        self.top_k = int(os.getenv("RAG_TOP_K", "5"))

    def _ensure_env(self) -> None:
        required = [
            "SNOWFLAKE_ACCOUNT",
            "SNOWFLAKE_USER",
            "SNOWFLAKE_PASSWORD",
            "GEMINI_API_KEY",
            "SNOWFLAKE_CORTEX_SEARCH_SERVICE",
        ]
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {missing}")

    def query(self, question: str) -> RAGResult:
        rows = self._retrieve_similar_rows(question)
        context_chunks = [
            str(self._get_nested_value(row, self.content_field) or "")
            for row in rows
            if str(self._get_nested_value(row, self.content_field) or "").strip()
        ]
        context = "\n\n---\n\n".join(context_chunks)
        prompt = SYSTEM_PROMPT.format(context=context, question=question)
        answer = self.llm.invoke(prompt).content

        citations = [self._to_citation(row) for row in rows]

        return RAGResult(answer=str(answer), citations=citations)

    def _retrieve_similar_rows(self, question: str) -> list[dict[str, object]]:
        search_payload = json.dumps(
            {
                "query": question,
                "limit": self.top_k,
            }
        )
        sql = "SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(%s, %s) AS response"
        with self.connection.cursor() as cursor:
            cursor.execute(sql, (self.cortex_search_service, search_payload))
            row = cursor.fetchone()
            if not row:
                return []
            response = self._parse_json_value(row[0])

        results = response.get("results", [])
        return [result for result in results if isinstance(result, dict)]

    def _to_citation(self, row: dict[str, object]) -> RetrievedCitation:
        case_name = str(
            self._get_nested_value(row, self.case_name_field)
            or row.get("case_name")
            or row.get("title")
            or "Unknown case"
        )
        url = str(
            self._get_nested_value(row, self.source_url_field)
            or row.get("source_url")
            or row.get("url")
            or ""
        )
        score = float(row.get("score") or row.get("_score") or row.get("@score") or 0.0)

        return RetrievedCitation(case_name=case_name, url=url, relevance_score=score)

    def _parse_json_value(self, raw_value: object) -> dict[str, object]:
        if isinstance(raw_value, dict):
            return raw_value
        if isinstance(raw_value, str):
            try:
                parsed = json.loads(raw_value)
                return parsed if isinstance(parsed, dict) else {}
            except json.JSONDecodeError:
                return {}
        return {}

    def _get_nested_value(self, row: dict[str, object], field_path: str) -> object:
        """Reads nested values from Cortex result rows using dot notation."""
        if not field_path:
            return None

        current: object = row
        for part in field_path.split("."):
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current
