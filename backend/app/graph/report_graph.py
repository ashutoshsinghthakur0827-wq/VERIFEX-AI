
from typing import Any, TypedDict

from langgraph.graph import StateGraph, END

from app.agents.report_agent import generate_report


class ReportState(TypedDict, total=False):
    investigation_title: str
    verification: dict[str, Any]
    include_review_notes: bool
    report: dict[str, Any]


def as_list(value: Any) -> list:
    return value if isinstance(value, list) else []


def build_report_node(state: ReportState) -> dict:
    verification = state.get("verification", {})

    if not isinstance(verification, dict):
        verification = {}

    # Read claims, research, evidence, and verification data.
    claims = as_list(verification.get("claims"))
    research_results = as_list(
        verification.get("research_results")
    )
    evidence_results = as_list(
        verification.get("evidence_results")
    )

    # Accept verification results from supported structures.
    verification_results = as_list(
        verification.get("verification_results")
    )

    if not verification_results:
        nested_verification = verification.get("verification")
        if isinstance(nested_verification, dict):
            verification_results = as_list(
                nested_verification.get("results")
            )

    if not verification_results:
        verification_results = as_list(
            verification.get("results")
        )

    # Prepare the exact input expected by report_agent.py.
    normalized_verification = {
        "results": verification_results,
        "limitations": as_list(
            verification.get("limitations")
        ),
        "analysis_type": verification.get(
            "analysis_type",
            "preliminary_ai_evidence_interpretation"
        ),
    }

    # Generate the main report using your report agent.
    report = generate_report(
        investigation_title=state.get(
            "investigation_title",
            "Verifex AI Investigation"
        ),
        verification=normalized_verification,
        include_review_notes=state.get(
            "include_review_notes",
            True
        ),
    )

    # Add claim and research information without treating
    # research sources as verified evidence.
    report["claims"] = claims
    report["research_results"] = research_results
    report["evidence_results"] = evidence_results
    report["verification_results"] = verification_results

    # Calculate counts from the actual supplied data.
    report["summary"]["input_claim_count"] = len(claims)
    report["summary"]["research_count"] = len(research_results)
    report["summary"]["evidence_count"] = len(evidence_results)
    report["summary"]["verification_count"] = len(
        verification_results
    )

    # Keep the report's existing total_claims count based on
    # actual Verification Agent results.
    report["summary"]["total_claims"] = len(
        verification_results
    )

    # Include sources from claims and research results.
    sources = []

    for claim in claims:
        if isinstance(claim, dict):
            for source in as_list(claim.get("sources")):
                if isinstance(source, dict) and source not in sources:
                    sources.append(source)

    for result in research_results:
        if isinstance(result, dict):
            for source in as_list(result.get("sources")):
                if isinstance(source, dict) and source not in sources:
                    sources.append(source)

    report["research_sources"] = sources
    report["summary"]["research_source_count"] = len(sources)

    # Preserve limitations and explain missing result categories.
    limitations = list(report.get("limitations", []))

    if not evidence_results:
        limitations.append(
            "No separate Evidence Agent results were supplied."
        )

    if not verification_results:
        limitations.append(
            "No Verification Agent results were supplied. "
            "No claim assessments have been inferred."
        )

    report["limitations"] = list(dict.fromkeys(limitations))

    report["human_review_required"] = True

    return {"report": report}


workflow = StateGraph(ReportState)

workflow.add_node("build_report", build_report_node)

workflow.set_entry_point("build_report")
workflow.add_edge("build_report", END)

report_graph = workflow.compile()
