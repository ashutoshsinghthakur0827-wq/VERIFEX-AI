
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.research_agent import research_claims


router = APIRouter(
    prefix="/api/research",
    tags=["Research Agent"]
)


class ResearchRequest(BaseModel):
    claims: list[str] = Field(
        min_length=1,
        max_length=5
    )


@router.post("/search")
def search_claims(request: ResearchRequest):
    cleaned_claims = [
        claim.strip()
        for claim in request.claims
        if claim.strip()
    ]

    if not cleaned_claims:
        raise HTTPException(
            status_code=422,
            detail="At least one non-empty claim is required."
        )

    if any(len(claim) > 2000 for claim in cleaned_claims):
        raise HTTPException(
            status_code=422,
            detail="Each claim must be 2,000 characters or fewer."
        )

    try:
        result = research_claims(cleaned_claims)

        return {
            "message": "Research completed.",
            "research": result.model_dump()
        }

    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        ) from exc