
from datetime import datetime, timezone
from typing import Any


def generate_report(
    investigation_title: str,
    verification: dict[str, Any],
    include_review_notes: bool = True,
) -> dict[str, Any]:

    results = verification.get("results", [])
    limitations = verification.get("limitations", [])

    report_results = []

    for item in results:
        report_results.append({
            "claim_text": item.get("claim_text", ""),
            "assessment": item.get(
                "assessment", "requires_review"
            ),
            "confidence": item.get("confidence", "low"),
            "reasoning": item.get(
                "reasoning", "Further review is required."
            ),
            "supporting_evidence": item.get(
                "supporting_evidence", []
            ),
            "contradicting_evidence": item.get(
                "contradicting_evidence", []
            ),
            "contextual_evidence": item.get(
                "contextual_evidence", []
            ),
            "uncertainty": item.get("uncertainty", []),
            "source_limitations": item.get(
                "source_limitations", []
            ),
            "human_review_required": True,
        })

    report = {
        "title": investigation_title,
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "analysis_type": verification.get(
            "analysis_type",
            "preliminary_ai_evidence_interpretation"
        ),
        "summary": {
            "total_claims": len(report_results),
            "human_review_required": True,
            "overall_status": "preliminary_review",
        },
        "results": report_results,
        "limitations": limitations,
        "disclaimer": (
            "This report contains preliminary AI-generated "
            "evidence interpretations. It does not determine "
            "whether claims are definitively true, false, "
            "or fraudulent. Review the cited evidence and "
            "corroborate important claims independently."
        ),
    }

    if include_review_notes:
        report["review_notes"] = [
            "Check the original source and publication context.",
            "Verify that evidence excerpts are complete and accurate.",
            "Seek independent corroboration for important claims.",
            "Review uncertainty and conflicting evidence before drawing conclusions.",
        ]

    return report