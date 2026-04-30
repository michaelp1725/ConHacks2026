import os
from dataclasses import dataclass
import json
import re
from urllib.parse import quote_plus
from collections.abc import Iterator

import snowflake.connector
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.services.classifier import QueryClassifier, QueryRoute


SYSTEM_PROMPT = PromptTemplate.from_template(
    """You are a legal research assistant for Canadian refugee law.
You are helping self-represented litigants (SRLs) — people navigating the refugee system without a lawyer.
Answer ONLY using the context and source list below.

Rules:
1) Do not use outside knowledge. If context is insufficient, say so in the explanation field.
2) Write for SRLs in plain, calm, professional language. Be respectful and clear, not childish.
3) Do NOT output bare bracket citations like [56] or [12-13].
4) Read ALL sources in the context before writing your answer.
5) Use source markers [S1], [S2], etc. inline in the explanation for factual claims. Only cite sources that are directly relevant — do not cite a source just because it exists.
6) Return ONLY valid JSON — no markdown fences, no extra text before or after.
7) next_steps must contain only concrete, self-actionable steps the user can take themselves. Do NOT suggest consulting a lawyer — the user has no lawyer.
8) checklist must contain only specific documents and evidence to bring to the RPD hearing.
9) The explanation is the most important SRL-facing text. It should:
   - start with the practical meaning of the issue in one clear sentence;
   - explain legal tests in plain words before using the legal label;
   - define important legal terms briefly, in the same sentence;
   - avoid dense phrases like "refers to whether", "to establish", "sufficient evidence", "identified area", and "memorandum of argument" unless the source requires them;
   - use "you" and "your claim" when helpful;
   - connect the law to what the decision-maker will likely look at;
   - stay concise: usually 2 short paragraphs, no more than 180 words.
10) checklist and next_steps should stay practical and specific. Do not make them sound like formal legal submissions unless the user asked for formal drafting help.

Return this exact JSON structure:
{{
  "explanation": "Plain-language explanation for an SRL, with [S1], [S2] citations inline.",
  "checklist": ["Specific document or evidence to bring to the RPD hearing", "..."],
  "next_steps": ["Concrete self-help action the user can take without a lawyer", "..."],
  "disclaimer": "This is legal information, not legal advice. Consult a qualified Canadian immigration lawyer if possible."
}}

Context:
{context}

Source List:
{source_list}

Question:
{question}"""
)

_FALLBACK_DISCLAIMER = (
    "This is legal information, not legal advice. "
    "Consult a qualified Canadian immigration lawyer."
)

_OUT_OF_SCOPE_PROMPT = """\
You are a Canadian refugee law assistant. The user has asked something outside your scope.
Politely explain that you specialise in Canadian refugee law (RPD/RAD tribunal decisions and \
immigration legislation), and suggest how they might rephrase their question to get help.
Keep your response to 2-3 sentences. Do not answer the out-of-scope question itself.

User question: {question}"""

STREAM_PROMPT = PromptTemplate.from_template(
    """You are a legal research assistant for Canadian refugee law.
You are helping self-represented litigants (SRLs) — people navigating the refugee system without a lawyer.
Answer ONLY using the context and source list below.

Rules:
1) Do not use outside knowledge. If context is insufficient, say so.
2) Write for SRLs in plain, calm, professional language. Be respectful and clear, not childish.
3) Do NOT output bare bracket citations like [56] or [12-13].
4) Use source markers [S1], [S2], etc. inline for factual claims. Only cite sources that are directly relevant.
5) Write in flowing prose — no JSON, no markdown fences, no structured fields.
6) Explain legal tests in plain words before using legal labels. Define important legal terms briefly. Avoid dense phrasing like "to establish" and "sufficient evidence" when a simpler phrase works.

Context:
{context}

Source List:
{source_list}

Question:
{question}"""
)

FOLLOW_UP_PROMPT = PromptTemplate.from_template(
    """You are a Canadian refugee law assistant.
The user is asking a follow-up about the prior assistant answer below.
Answer using ONLY the prior assistant answer. Do not retrieve or invent new legal facts.
Write for SRLs in plain, calm, professional language. If the user asks for a summary or rewrite, preserve the meaning and remove citations unless they are necessary.
Return ONLY valid JSON — no markdown fences, no extra text before or after.

Return this exact JSON structure:
{{
  "explanation": "Direct plain-language answer to the user's follow-up.",
  "checklist": [],
  "next_steps": [],
  "disclaimer": "This is legal information, not legal advice. Consult a qualified Canadian immigration lawyer if possible."
}}

Prior assistant answer:
{prior_answer}

User follow-up:
{question}"""
)

STANDALONE_QUERY_PROMPT = PromptTemplate.from_template(
    """Rewrite the current user question as a standalone Canadian refugee law research query.
Use the prior conversation only to resolve references like "that", "this", "the claim", or "what about state protection".
Do not answer the question.
Keep the rewritten query to one sentence.

Prior conversation:
{history}

Current question:
{question}

Standalone query:"""
)


@dataclass
class RetrievedCitation:
    case_name: str
    url: str
    relevance_score: float
    source_type: str  # "case" or "law"
    label: str = ""  # "S1", "S2", etc. — set after filtering


@dataclass
class RAGResult:
    explanation: str
    checklist: list[str]
    next_steps: list[str]
    disclaimer: str
    citations: list[RetrievedCitation]
    route: str


@dataclass
class RAGPreparedQuery:
    prompt: str
    citations: list[RetrievedCitation]
    route: str = ""


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

        self.case_service = os.environ["SNOWFLAKE_CORTEX_SEARCH_SERVICE"]
        self.laws_service = os.environ["SNOWFLAKE_CORTEX_LAWS_SEARCH_SERVICE"]
        self.content_field = os.environ["SNOWFLAKE_CORTEX_CONTENT_FIELD"]
        self.case_name_field = os.environ["SNOWFLAKE_CORTEX_CASE_NAME_FIELD"]
        self.source_url_field = os.environ["SNOWFLAKE_CORTEX_SOURCE_URL_FIELD"]
        self.top_k = int(os.environ["RAG_TOP_K"])

        self.classifier = QueryClassifier(self.llm)

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
            "SNOWFLAKE_CORTEX_LAWS_SEARCH_SERVICE",
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

    def query(self, question: str, history: list[dict[str, str]] | None = None) -> RAGResult:
        if self._is_history_transform_request(question, history):
            return self._answer_from_history(question, history or [])

        research_question = self._standalone_question(question, history)
        route = self.classifier.classify(research_question, history)

        if route == QueryRoute.OUT_OF_SCOPE:
            explanation = str(
                self.llm.invoke(_OUT_OF_SCOPE_PROMPT.format(question=research_question)).content
            ).strip()
            return RAGResult(
                explanation=explanation,
                checklist=[],
                next_steps=[],
                disclaimer=_FALLBACK_DISCLAIMER,
                citations=[],
                route=route.value,
            )

        if route == QueryRoute.CASE_SEARCH:
            rows = self._retrieve_from_service(research_question, self.case_service)
            citations = [self._to_citation(row, "case") for row in rows]
        elif route == QueryRoute.LAW_SEARCH:
            rows = self._retrieve_from_service(research_question, self.laws_service)
            citations = [self._to_citation(row, "law") for row in rows]
        else:  # BOTH — top_k from each service, up to 2*top_k total context
            case_rows = self._retrieve_from_service(research_question, self.case_service)
            law_rows = self._retrieve_from_service(research_question, self.laws_service)
            rows = case_rows + law_rows
            citations = (
                [self._to_citation(row, "case") for row in case_rows]
                + [self._to_citation(row, "law") for row in law_rows]
            )

        context, source_list = self._build_grounded_context(rows, citations)
        prompt = SYSTEM_PROMPT.format(
            context=context,
            source_list=source_list,
            question=research_question,
        )
        raw = str(self.llm.invoke(prompt).content).strip()
        return self._parse_structured_response(raw, citations, route.value)

    def prepare_stream_query(self, question: str, history: list[dict[str, str]] | None = None) -> RAGPreparedQuery:
        """Like query() but builds a prose prompt for token-by-token streaming."""
        research_question = self._standalone_question(question, history)
        route = self.classifier.classify(research_question, history)

        if route == QueryRoute.OUT_OF_SCOPE:
            prompt = _OUT_OF_SCOPE_PROMPT.format(question=research_question)
            return RAGPreparedQuery(prompt=prompt, citations=[], route=route.value)

        if route == QueryRoute.CASE_SEARCH:
            rows = self._retrieve_from_service(research_question, self.case_service)
            citations = [self._to_citation(row, "case") for row in rows]
        elif route == QueryRoute.LAW_SEARCH:
            rows = self._retrieve_from_service(research_question, self.laws_service)
            citations = [self._to_citation(row, "law") for row in rows]
        else:
            case_rows = self._retrieve_from_service(research_question, self.case_service)
            law_rows = self._retrieve_from_service(research_question, self.laws_service)
            rows = case_rows + law_rows
            citations = (
                [self._to_citation(row, "case") for row in case_rows]
                + [self._to_citation(row, "law") for row in law_rows]
            )

        for i, c in enumerate(citations, start=1):
            c.label = f"S{i}"

        context, source_list = self._build_grounded_context(rows, citations)
        prompt = STREAM_PROMPT.format(
            context=context,
            source_list=source_list,
            question=research_question,
        )
        return RAGPreparedQuery(prompt=prompt, citations=citations, route=route.value)

    def stream_answer(self, prompt: str) -> Iterator[str]:
        for chunk in self.llm.stream(prompt):
            content = chunk.content
            if isinstance(content, str) and content:
                yield content

    def finalize_answer(self, answer: str, citations: list[RetrievedCitation]) -> str:
        return answer

    def _answer_from_history(
        self, question: str, history: list[dict[str, str]]
    ) -> RAGResult:
        prior_answer = self._last_assistant_message(history)
        if not prior_answer:
            return RAGResult(
                explanation="I do not have a prior answer to work from yet. Ask a Canadian refugee law question first.",
                checklist=[],
                next_steps=[],
                disclaimer=_FALLBACK_DISCLAIMER,
                citations=[],
                route="FOLLOW_UP",
            )

        raw = str(
            self.llm.invoke(
                FOLLOW_UP_PROMPT.format(question=question, prior_answer=prior_answer)
            ).content
        ).strip()
        return self._parse_structured_response(raw, [], "FOLLOW_UP")

    def _standalone_question(
        self, question: str, history: list[dict[str, str]] | None
    ) -> str:
        if not history or not self._looks_contextual(question):
            return question

        recent = history[-6:]
        history_text = "\n".join(
            f"{message['role'].capitalize()}: {message['content']}" for message in recent
        )
        rewritten = str(
            self.llm.invoke(
                STANDALONE_QUERY_PROMPT.format(history=history_text, question=question)
            ).content
        ).strip()
        return rewritten or question

    @staticmethod
    def _last_assistant_message(history: list[dict[str, str]]) -> str:
        for message in reversed(history):
            if message.get("role") == "assistant" and message.get("content"):
                return message["content"]
        return ""

    @staticmethod
    def _is_history_transform_request(
        question: str, history: list[dict[str, str]] | None
    ) -> bool:
        if not history:
            return False

        text = question.lower().strip()
        transform_terms = (
            "summarize",
            "summary",
            "shorter",
            "shorten",
            "rewrite",
            "reword",
            "simplify",
            "explain that",
            "explain it",
            "in one sentence",
            "1 sentence",
            "one sentence",
            "bullet",
            "bullets",
            "make that",
            "make it",
            "what did you mean",
        )
        references_prior = (
            "that",
            "it",
            "this",
            "above",
            "previous",
            "prior",
            "last answer",
            "response",
        )
        return any(term in text for term in transform_terms) and (
            any(ref in text for ref in references_prior)
            or len(text.split()) <= 8
        )

    @staticmethod
    def _looks_contextual(question: str) -> bool:
        text = question.lower().strip()
        contextual_markers = (
            "that",
            "it",
            "this",
            "they",
            "their",
            "those",
            "same",
            "above",
            "previous",
            "what about",
            "how about",
            "tell me more",
            "expand",
        )
        return any(marker in text for marker in contextual_markers)

    def _parse_structured_response(
        self, raw: str, citations: list[RetrievedCitation], route: str
    ) -> RAGResult:
        text = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE).strip()

        # Gemini sometimes prepends prose before the JSON object — extract just the object
        if not text.startswith("{"):
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                text = match.group(0)

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            used_citations = self._filter_used_citations(raw, citations)
            return RAGResult(
                explanation=raw,
                checklist=[],
                next_steps=[],
                disclaimer=_FALLBACK_DISCLAIMER,
                citations=used_citations,
                route=route,
            )

        raw_explanation = data.get("explanation", "")
        used_citations = self._filter_used_citations(raw_explanation, citations)
        return RAGResult(
            explanation=raw_explanation,
            checklist=data.get("checklist") or [],
            next_steps=data.get("next_steps") or [],
            disclaimer=data.get("disclaimer") or _FALLBACK_DISCLAIMER,
            citations=used_citations,
            route=route,
        )

    @staticmethod
    def _filter_used_citations(
        explanation: str, citations: list[RetrievedCitation]
    ) -> list[RetrievedCitation]:
        used_indices = {int(m) for m in re.findall(r"S(\d+)", explanation)}
        result = []
        for i, c in enumerate(citations, start=1):
            if i in used_indices:
                c.label = f"S{i}"
                result.append(c)
        return result

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
                        f"[{source_tag}] Source: {citation.case_name}",
                        f"[{source_tag}] URL: {citation.url}",
                    ]
                )
            )

        context = "\n\n---\n\n".join(context_sections)
        source_list = "\n".join(source_sections)
        return context, source_list

    def _retrieve_from_service(
        self, question: str, service: str
    ) -> list[dict[str, object]]:
        search_payload = json.dumps(
            {
                "query": question,
                "limit": self.top_k,
                "columns": [self.content_field, "METADATA_STR"],
            }
        )
        sql = "SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(%s, %s) AS response"
        with self.connection.cursor() as cursor:
            cursor.execute(sql, (service, search_payload))
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

    def _to_citation(self, row: dict[str, object], source_type: str) -> RetrievedCitation:
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
        url = self._resolve_source_url(raw_url=raw_url, case_name=case_name, citation=case_name)

        scores = row.get("@scores")
        if not isinstance(scores, dict):
            raise RuntimeError("Missing @scores object in Cortex result.")
        reranker_score = scores.get("reranker_score")
        if not isinstance(reranker_score, (int, float)):
            raise RuntimeError("Missing numeric @scores.reranker_score in Cortex result.")

        return RetrievedCitation(case_name=case_name, url=url, relevance_score=float(reranker_score), source_type=source_type)

    def _resolve_source_url(self, raw_url: str, case_name: str, citation: str) -> str:
        candidate = raw_url.strip()
        if candidate.startswith("http://") or candidate.startswith("https://"):
            return candidate
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
        if not field_path:
            return None
        current: object = row
        for part in field_path.split("."):
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current
