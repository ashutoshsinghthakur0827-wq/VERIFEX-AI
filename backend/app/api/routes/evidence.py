
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
    clean_claims = []

    for claim in request.claims:
        claim_text = claim.claim_text.strip()

        if not claim_text:
            raise HTTPException(
                status_code=400,
                detail="Claim text cannot be empty.",
            )

        if len(claim_text) > 2000:
            raise HTTPException(
                status_code=400,
                detail="Claim text cannot exceed 2,000 characters.",
            )

        if len(claim.sources) > 10:
            raise HTTPException(
                status_code=400,
                detail="A maximum of 10 sources is allowed per claim.",
            )

        clean_claims.append(
            ClaimEvidenceInput(
                claim_text=claim_text,
                sources=claim.sources,
            )
        )

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

    except Exception:
        logger.exception("Evidence analysis failed")

        raise HTTPException(
            status_code=500,
            detail="Evidence analysis failed.",
        )
