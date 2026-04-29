import os
from dataclasses import dataclass
from typing import Any

import snowflake.connector
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

try:
    from langchain_community.vectorstores import SnowflakeVectorStore
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "SnowflakeVectorStore import failed. Install/update langchain-community."
    ) from exc


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
    """Startup-initialized RAG service backed by Snowflake vectors."""

    def __init__(self) -> None:
        load_dotenv()
        self._ensure_env()

        self.llm = ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=os.environ["GEMINI_API_KEY"],
            temperature=0,
        )
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001"),
            google_api_key=os.environ["GEMINI_API_KEY"],
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

        self.vectorstore = self._build_vectorstore()
        self.top_k = int(os.getenv("RAG_TOP_K", "5"))

    def _ensure_env(self) -> None:
        required = [
            "SNOWFLAKE_ACCOUNT",
            "SNOWFLAKE_USER",
            "SNOWFLAKE_PASSWORD",
            "GEMINI_API_KEY",
            "SNOWFLAKE_TABLE",
        ]
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {missing}")

    def _build_vectorstore(self) -> SnowflakeVectorStore:
        """Try common SnowflakeVectorStore constructor signatures."""
        base_kwargs = {
            "connection": self.connection,
            "embedding": self.embeddings,
            "table_name": os.environ["SNOWFLAKE_TABLE"],
        }

        optional_kwargs = {
            "database": os.getenv("SNOWFLAKE_DATABASE"),
            "schema": os.getenv("SNOWFLAKE_SCHEMA"),
            "text_column": os.getenv("SNOWFLAKE_TEXT_COLUMN", "TEXT"),
            "embedding_column": os.getenv("SNOWFLAKE_VECTOR_COLUMN", "EMBEDDING"),
            "metadata_column": os.getenv("SNOWFLAKE_METADATA_COLUMN", "METADATA"),
        }
        cleaned_optional = {k: v for k, v in optional_kwargs.items() if v}

        attempts: list[dict[str, Any]] = [
            {**base_kwargs, **cleaned_optional},
            {"connection": self.connection, "embedding": self.embeddings},
            {
                "connection": self.connection,
                "embedding_function": self.embeddings,
                "table_name": os.environ["SNOWFLAKE_TABLE"],
                **cleaned_optional,
            },
        ]

        last_error: Exception | None = None
        for kwargs in attempts:
            try:
                return SnowflakeVectorStore(**kwargs)
            except Exception as exc:  # pragma: no cover
                last_error = exc

        raise RuntimeError(
            f"Failed to initialize SnowflakeVectorStore with available constructor variants: {last_error}"
        )

    def query(self, question: str) -> RAGResult:
        docs_with_scores = self.vectorstore.similarity_search_with_relevance_scores(
            question, k=self.top_k
        )
        context_chunks = [doc.page_content for doc, _ in docs_with_scores]
        context = "\n\n---\n\n".join(context_chunks)
        prompt = SYSTEM_PROMPT.format(context=context, question=question)
        answer = self.llm.invoke(prompt).content

        citations: list[RetrievedCitation] = []
        for doc, score in docs_with_scores:
            citations.append(self._to_citation(doc, score))

        return RAGResult(answer=str(answer), citations=citations)

    def _to_citation(self, doc: Document, score: float) -> RetrievedCitation:
        metadata = doc.metadata or {}
        case_name = str(metadata.get("case_name", metadata.get("title", "Unknown case")))
        url = str(metadata.get("source_url", metadata.get("url", "")))
        return RetrievedCitation(case_name=case_name, url=url, relevance_score=float(score))
