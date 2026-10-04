
from typing import Any, Optional

from pydantic import BaseModel, Field, ConfigDict, model_validator


class EvidenceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    source_title: str = "Unknown source"
    source_url: str = ""
    evidence_excerpt: str = ""
    relevance: str = "unknown"
    matching_terms: list[str] = Field(default_factory=list)
    explanation: str = ""
    stance: str = "requires_review"
    source_reliability: str = "unassessed"


class SourceAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = "Unknown source"
    url: str = ""
    publisher_domain: str = ""
    publication_date: Optional[str] = None
    indicators: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    reliability: str = "unassessed"


class ClaimEvidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    claim_text: str = Field(min_length=1)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    source_assessments: list[SourceAssessment] = Field(
        default_factory=list
    )
    evidence_status: str = "requires_review"
    explanation: str = ""

    @model_validator(mode="before")
    @classmethod
    def normalize_claim(cls, value):
        if isinstance(value, str):
            return {"claim_text": value}

        if not isinstance(value, dict):
            return value

        value = value.copy()

        if not value.get("claim_text"):
            value["claim_text"] = (
                value.get("text")
                or value.get("claim")
                or value.get("statement")
            )

        return value


class VerificationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    claims: list[ClaimEvidence] = Field(
        default_factory=list,
        max_length=10,
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_evidence_response(cls, value):
        if not isinstance(value, dict):
            return value

        value = value.copy()

        # Already in the Verification Agent format.
        if isinstance(value.get("claims"), list):
            return value

        # Also accept the complete Evidence Agent response:
        # {"message": "...", "evidence_analysis": {"results": [...]}}
        evidence_analysis = value.get("evidence_analysis")

        if isinstance(evidence_analysis, dict):
            results = evidence_analysis.get("results", [])

            if isinstance(results, list):
                value["claims"] = results

        # Also accept an evidence_analysis object directly.
        elif isinstance(value.get("results"), list):
            value["claims"] = value["results"]

        return value


class VerificationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    claim_text: str
    assessment: str = "inconclusive"
    confidence: str = "low"

    supporting_evidence: list[dict[str, Any]] = Field(
        default_factory=list
    )
    contradicting_evidence: list[dict[str, Any]] = Field(
        default_factory=list
    )
    contextual_evidence: list[dict[str, Any]] = Field(
        default_factory=list
    )

    reasoning: str = ""
    uncertainty: list[str] = Field(default_factory=list)
    source_limitations: list[str] = Field(default_factory=list)
    human_review_required: bool = True


class VerificationResponse(BaseModel):
    message: str
    verification: dict[str, Any]