
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.evidence_agent import analyze_evidence
from app.schemas.evidence import (
    ClaimEvidenceInput,
    EvidenceAnalysisResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/evidence",
    tags=["Evidence Agent"],
)


class EvidenceRequest(BaseModel):
    claims: list[ClaimEvidenceInput] = Field(
        min_length=1,
        max_length=5,
    )


@router.post("/analyze")
def evidence_analysis(request: EvidenceRequest):
    """
    Analyze evidence supplied for each claim.

    Limits:
    - 1 to 5 claims per request
    - 2,000 characters per claim
    - Maximum 10 sources per claim
    """

    clean_claims = []

    # Validate and clean incoming claims
    for claim_index, claim in enumerate(request.claims):
        claim_text = claim.claim_text.strip()

        if not claim_text:
            raise HTTPException(
                status_code=400,
                detail=f"Claim {claim_index + 1} cannot be empty.",
            )

        if len(claim_text) > 2000:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Claim {claim_index + 1} cannot exceed "
                    "2,000 characters."
                ),
            )

        if len(claim.sources) > 10:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Claim {claim_index + 1} cannot contain "
                    "more than 10 sources."
                ),
            )

        # Keep the source data while cleaning the claim text
        clean_claims.append(
            ClaimEvidenceInput(
                claim_text=claim_text,
                sources=claim.sources,
            )
        )

    # Analyze evidence
    try:
        result: EvidenceAnalysisResponse = analyze_evidence(
            clean_claims
        )

        return {
            "message": "Preliminary evidence mapping completed.",
            "evidence_analysis": result.model_dump(),
        }

    except HTTPException:
        raise

    except ValueError as exc:
        logger.warning(
            "Invalid evidence analysis input: %s",
            str(exc),
        )
        raise HTTPException(
            status_code=422,
            detail="The evidence analysis input is invalid.",
        ) from exc

    except Exception as exc:
        logger.exception(
            "Evidence analysis failed: %s",
            str(exc),
        )
        raise HTTPException(
            status_code=500,
            detail="Evidence analysis failed. Please try again later.",
        ) from exc
