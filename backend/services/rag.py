import os
from dataclasses import dataclass
import json
import re
from urllib.parse import quote_plus

import snowflake.connector
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI


SYSTEM_PROMPT = PromptTemplate.from_template(
    """You are a legal research assistant for Canadian refugee law.
Answer ONLY using the context and source list below.

Rules:
1) Do not use outside knowledge.
2) If context is insufficient, say: "I do not have enough information in the provided cases."
3) Keep answers concise and professional.
4) Do NOT output bare bracket citations like [56] or [12-13].
5) Use source markers [S1], [S2], etc. in the explanation for factual claims.
6) End with a "References" section using markdown links in this exact style:
   - [Case Name](https://example.com) [S1]
7) Only include references that appear in the provided Source List.

Context:
{context}

Source List:
{source_list}

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
            model=os.environ["GEMINI_MODEL"],
            google_api_key=os.environ["GEMINI_API_KEY"],
            temperature=0,
        )

        self.connection = snowflake.connector.connect(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user=os.environ["SNOWFLAKE_USER"],
            password=os.environ["SNOWFLAKE_PASSWORD"],
            warehouse=os.environ["SNOWFLAKE_WAREHOUSE"],
            database=os.environ["SNOWFLAKE_DATABASE"],
            schema=os.environ["SNOWFLAKE_SCHEMA"],
            role=os.environ["SNOWFLAKE_ROLE"],
        )

        self.cortex_search_service = os.environ["SNOWFLAKE_CORTEX_SEARCH_SERVICE"]
        self.content_field = os.environ["SNOWFLAKE_CORTEX_CONTENT_FIELD"]
        self.case_name_field = os.environ["SNOWFLAKE_CORTEX_CASE_NAME_FIELD"]
        self.source_url_field = os.environ["SNOWFLAKE_CORTEX_SOURCE_URL_FIELD"]
        self.top_k = int(os.environ["RAG_TOP_K"])

    def _ensure_env(self) -> None:
        required = [
            "GEMINI_MODEL",
            "SNOWFLAKE_ACCOUNT",
            "SNOWFLAKE_USER",
            "SNOWFLAKE_PASSWORD",
            "SNOWFLAKE_WAREHOUSE",
            "SNOWFLAKE_DATABASE",
            "SNOWFLAKE_SCHEMA",
            "SNOWFLAKE_ROLE",
            "GEMINI_API_KEY",
            "SNOWFLAKE_CORTEX_SEARCH_SERVICE",
            "SNOWFLAKE_CORTEX_CONTENT_FIELD",
            "SNOWFLAKE_CORTEX_CASE_NAME_FIELD",
            "SNOWFLAKE_CORTEX_SOURCE_URL_FIELD",
            "RAG_TOP_K",
        ]
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {missing}")
        if int(os.environ["RAG_TOP_K"]) <= 0:
            raise RuntimeError("RAG_TOP_K must be a positive integer.")

    def query(self, question: str) -> RAGResult:
        rows = self._retrieve_similar_rows(question)
        citations = [self._to_citation(row) for row in rows]
        context, source_list = self._build_grounded_context(rows, citations)
        prompt = SYSTEM_PROMPT.format(
            context=context,
            source_list=source_list,
            question=question,
        )
        raw_answer = str(self.llm.invoke(prompt).content)
        answer = self._with_references(raw_answer, citations)

        return RAGResult(answer=answer, citations=citations)

    def _with_references(self, answer: str, citations: list[RetrievedCitation]) -> str:
        clean_answer = answer.strip()
        clean_answer = re.sub(r"\[\d+(?:\s*-\s*\d+)?\]", "", clean_answer)

        reference_lines: list[str] = []
        for index, citation in enumerate(citations, start=1):
            if not citation.url:
                continue
            tag = f"S{index}"
            reference_lines.append(f"- [{citation.case_name}]({citation.url}) [{tag}]")

        if not reference_lines:
            return clean_answer

        reference_block = "References:\n" + "\n".join(reference_lines)
        if "references:" in clean_answer.lower():
            return clean_answer

        return f"{clean_answer}\n\n{reference_block}"

    def _build_grounded_context(
        self,
        rows: list[dict[str, object]],
        citations: list[RetrievedCitation],
    ) -> tuple[str, str]:
        context_sections: list[str] = []
        source_sections: list[str] = []

        for index, (row, citation) in enumerate(zip(rows, citations), start=1):
            source_tag = f"S{index}"
            chunk_value = self._get_nested_value(row, self.content_field)
            if not isinstance(chunk_value, str) or not chunk_value.strip():
                raise RuntimeError(
                    f"Missing or empty content field '{self.content_field}' in Cortex result."
                )
            chunk_text = chunk_value.strip()

            context_sections.append(f"[{source_tag}]\n{chunk_text}")
            source_sections.append(
                "\n".join(
                    [
                        f"[{source_tag}] Case: {citation.case_name}",
                        f"[{source_tag}] URL: {citation.url}",
                    ]
                )
            )

        context = "\n\n---\n\n".join(context_sections)
        source_list = "\n".join(source_sections)
        return context, source_list

    def _retrieve_similar_rows(self, question: str) -> list[dict[str, object]]:
        search_payload = json.dumps(
            {
                "query": question,
                "limit": self.top_k,
                "columns": [self.content_field, "METADATA_STR"],
            }
        )
        sql = "SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(%s, %s) AS response"
        with self.connection.cursor() as cursor:
            cursor.execute(sql, (self.cortex_search_service, search_payload))
            row = cursor.fetchone()
            if not row:
                raise RuntimeError("Cortex search returned no response row.")
            response = self._parse_json_value(row[0])

        results = response.get("results")
        if not isinstance(results, list):
            raise RuntimeError("Cortex search response is missing a valid 'results' list.")
        if any(not isinstance(result, dict) for result in results):
            raise RuntimeError("Cortex search response contains invalid result entries.")
        return results

    def _to_citation(self, row: dict[str, object]) -> RetrievedCitation:
        metadata = self._extract_metadata(row)
        citation_value = metadata.get(self.case_name_field)
        if not isinstance(citation_value, str) or not citation_value.strip():
            raise RuntimeError(
                f"Missing required metadata field '{self.case_name_field}' in Cortex result."
            )
        case_name = citation_value.strip()

        raw_url_value = metadata.get(self.source_url_field)
        if not isinstance(raw_url_value, str) or not raw_url_value.strip():
            raise RuntimeError(
                f"Missing required metadata field '{self.source_url_field}' in Cortex result."
            )
        raw_url = raw_url_value.strip()
        url = self._resolve_source_url(
            raw_url=raw_url,
            case_name=case_name,
            citation=case_name,
        )
        scores = row.get("@scores")
        if not isinstance(scores, dict):
            raise RuntimeError("Missing @scores object in Cortex result.")
        reranker_score = scores.get("reranker_score")
        if not isinstance(reranker_score, (int, float)):
            raise RuntimeError("Missing numeric @scores.reranker_score in Cortex result.")
        score = float(reranker_score)

        return RetrievedCitation(case_name=case_name, url=url, relevance_score=score)

    def _resolve_source_url(self, raw_url: str, case_name: str, citation: str) -> str:
        candidate = raw_url.strip()
        if candidate.startswith("http://") or candidate.startswith("https://"):
            return candidate

        # Dataset often stores file ids like "3598142.txt", which are not directly browsable.
        # Prefer citation-based search for precision, then fall back to case name.
        query = citation.strip() or case_name.strip()
        if not query:
            return ""
        encoded_query = quote_plus(query)
        return f"https://www.canlii.org/#search/indexLang=en&id={encoded_query}"

    def _extract_metadata(self, row: dict[str, object]) -> dict[str, object]:
        value = row.get("METADATA_STR")
        if not isinstance(value, str) or not value.strip():
            raise RuntimeError("Missing required METADATA_STR in Cortex result.")
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            raise RuntimeError("METADATA_STR is not valid JSON.") from exc
        if not isinstance(parsed, dict):
            raise RuntimeError("METADATA_STR must decode to a JSON object.")
        return parsed

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
