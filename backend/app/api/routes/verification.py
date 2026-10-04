
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.verification import (
    VerificationRequest,
    VerificationResponse,
)
from app.graph.verification_graph import verification_graph

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/verification",
    tags=["Verification Agent"],
)


@router.post(
    "/analyze",
    response_model=VerificationResponse,
)
async def analyze_verification(
    payload: VerificationRequest,
):
    if not payload.claims:
        raise HTTPException(
            status_code=400,
            detail="At least one claim is required for verification.",
        )

    try:
        # Preserve the evidence excerpts and source assessments.
        claims = [
            claim.model_dump()
            for claim in payload.claims
        ]

        for claim in claims:
            # Ensure the graph receives usable evidence arrays.
            claim["evidence"] = claim.get("evidence") or []
            claim["source_assessments"] = (
                claim.get("source_assessments") or []
            )

        input_data = {"claims": claims}

        logger.info(
            "Verification started: %d claims, %d evidence items",
            len(claims),
            sum(len(c["evidence"]) for c in claims),
        )

        output = verification_graph.invoke(input_data)

        if not isinstance(output, dict):
            raise ValueError(
                "Verification graph returned an invalid response."
            )

        results = output.get("results", [])
        limitations = output.get("limitations", [])

        if not isinstance(results, list):
            results = []

        if not isinstance(limitations, list):
            limitations = []

        return VerificationResponse(
            message="Preliminary verification analysis completed.",
            verification={
                "results": results,
                "analysis_type": (
                    "preliminary_ai_evidence_interpretation"
                ),
                "limitations": limitations,
                "human_review_required": True,
            },
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Verification analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Verification failed. Please check backend logs.",
        )