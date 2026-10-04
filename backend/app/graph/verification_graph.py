
import logging
from typing import Any

from langgraph.graph import StateGraph, END

from app.graph.state import VerificationState
from app.agents.verification_agent import verify_claim

logger = logging.getLogger(__name__)

GENERAL_LIMITATIONS = [
    "AI-generated assessments are preliminary and require human review.",
    "Source excerpts may be incomplete, inaccurate, or out of context.",
    "Publisher indicators do not independently establish source reliability.",
    "The system does not determine whether a claim is definitively true, false, or fraudulent.",
    "Important claims should be corroborated using independent sources.",
]


def to_dict(value: Any) -> dict:
    """Convert supported claim objects into dictionaries."""
    if isinstance(value, dict):
        return value

    if hasattr(value, "model_dump"):
        return value.model_dump()

    raise TypeError("Claim must be a dictionary or Pydantic model.")


def verification_node(
    state: VerificationState,
) -> VerificationState:
    claims = state.get("claims", [])
    results = []

    if not isinstance(claims, list):
        claims = []

    for claim in claims:
        try:
            clean_claim = to_dict(claim)

            result = verify_claim(clean_claim)

            if not isinstance(result, dict):
                raise TypeError(
                    "Verification Agent must return a dictionary."
                )

        except Exception:
            logger.exception("Claim verification failed.")

            try:
                clean_claim = to_dict(claim)
                claim_text = str(
                    clean_claim.get("claim_text", "")
                )
                evidence = clean_claim.get("evidence", [])
                if not isinstance(evidence, list):
                    evidence = []
                contextual = [
                    item for item in evidence
                    if isinstance(item, dict)
                ]
            except Exception:
                claim_text = ""
                contextual = []
                clean_claim = {}

            result = {
                "claim_text": claim_text,
                "assessment": (
                    "requires_review"
                    if contextual
                    else "insufficient_evidence"
                ),
                "confidence": "low",
                "supporting_evidence": [],
                "contradicting_evidence": [],
                "contextual_evidence": contextual,
                "reasoning": (
                    "Verification failed. Human review is required."
                ),
                "uncertainty": [
                    "The claim could not be automatically processed."
                ],
                "source_limitations": [],
                "human_review_required": True,
            }

        source_limitations = result.get(
            "source_limitations", []
        )

        if not isinstance(source_limitations, list):
            source_limitations = []

        # Merge source and general limitations without duplicates.
        result["source_limitations"] = list(
            dict.fromkeys(
                [
                    str(item)
                    for item in source_limitations
                    if item
                ] + GENERAL_LIMITATIONS
            )
        )

        # Enforce human review for all AI-generated assessments.
        result["human_review_required"] = True

        results.append(result)

    existing_limitations = state.get("limitations", [])
    if not isinstance(existing_limitations, list):
        existing_limitations = []

    all_limitations = list(
        dict.fromkeys(
            [
                str(item)
                for item in existing_limitations + GENERAL_LIMITATIONS
                if item
            ]
        )
    )

    return {
        "results": results,
        "limitations": all_limitations,
    }


def build_verification_graph():
    workflow = StateGraph(VerificationState)

    workflow.add_node(
        "verify_claims",
        verification_node,
    )

    workflow.set_entry_point("verify_claims")
    workflow.add_edge("verify_claims", END)

    return workflow.compile()


verification_graph = build_verification_graph()