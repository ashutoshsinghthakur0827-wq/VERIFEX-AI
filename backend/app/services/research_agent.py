
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from tavily import TavilyClient

from app.schemas.research import (
    ResearchResponse,
    ClaimResearch,
    ResearchSource,
)

logger = logging.getLogger(__name__)

# Load backend/.env, regardless of the current working directory
BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


def research_claims(
    claims: list[str],
    max_results: int = 5
) -> ResearchResponse:

    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        raise RuntimeError(
            "TAVILY_API_KEY is missing from backend/.env"
        )

    client = TavilyClient(api_key=api_key)

    results = []
    retrieved_at = datetime.now(timezone.utc).isoformat()

    for claim in claims:
        claim = claim.strip()

        if not claim:
            continue

        query = f"{claim} verification evidence"

        try:
            response = client.search(
                query=query,
                search_depth="basic",
                topic="general",
                max_results=max(1, min(max_results, 10)),
                include_answer=False,
                include_raw_content=False,
            )

            sources = []

            for item in response.get("results", []):
                url = item.get("url")

                if not isinstance(url, str):
                    continue

                if not url.startswith(("https://", "http://")):
                    continue

                source = ResearchSource(
                    title=str(item.get("title") or "Untitled source"),
                    url=url,
                    excerpt=str(item.get("content") or "")[:4000],
                    score=item.get("score"),
                    published_date=item.get("published_date"),
                    retrieved_at=retrieved_at,
                )

                sources.append(source)

            results.append(
                ClaimResearch(
                    claim_text=claim,
                    search_query=query,
                    sources=sources,
                    status="completed" if sources else "no_results",
                    message=(
                        "" if sources
                        else "No search results were returned."
                    ),
                )
            )

        except Exception:
            # Detailed error appears in the FastAPI terminal
            logger.exception("Tavily search failed for claim: %s", claim[:200])

            results.append(
                ClaimResearch(
                    claim_text=claim,
                    search_query=query,
                    sources=[],
                    status="failed",
                    message=(
                        "Source search failed. "
                        "Check backend logs and provider configuration."
                    ),
                )
            )

    return ResearchResponse(
        results=results,
        research_status="source_retrieval_only",
        limitations=[
            "Search results and excerpts are leads, not verified evidence.",
            "A search result may be incomplete, outdated, biased or unrelated.",
            "Sources have not yet been independently evaluated or corroborated.",
            "The system does not determine whether a claim is true or fraudulent.",
        ],
    )