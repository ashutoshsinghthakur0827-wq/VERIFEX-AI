
from typing import Literal, Optional

from pydantic import BaseModel, Field


class EvidenceSource(BaseModel):
    title: str = ""
    url: str
    excerpt: str = ""
    published_date: Optional[str] = None
    retrieved_at: Optional[str] = None
    score: Optional[float] = None


class ClaimEvidenceInput(BaseModel):
    claim_text: str
    sources: list[EvidenceSource] = Field(default_factory=list)


class EvidenceItem(BaseModel):
    source_title: str
    source_url: str
    evidence_excerpt: str
    relevance: str
    matching_terms: list[str] = Field(default_factory=list)
    explanation: str

    # Preliminary semantic classification
    stance: Literal[
        "supports",
        "contradicts",
        "context",
        "unrelated",
        "requires_review",
    ] = "requires_review"

    # Source reliability is not automatically verified
    source_reliability: Literal[
        "high",
        "moderate",
        "low",
        "unassessed",
    ] = "unassessed"


class SourceAssessment(BaseModel):
    title: str
    url: str
    publisher_domain: str
    publication_date: Optional[str] = None
    indicators: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)

    reliability: Literal[
        "high",
        "moderate",
        "low",
        "unassessed",
    ] = "unassessed"


class ClaimEvidenceResult(BaseModel):
    claim_text: str

    # Existing backend fields
    evidence: list[EvidenceItem] = Field(default_factory=list)
    source_assessments: list[SourceAssessment] = Field(
        default_factory=list
    )
    evidence_status: str = "inconclusive"
    explanation: str = ""

    # Frontend-compatible fields
    assessment: str = "requires_review"
    evidence_summary: str = ""
    supporting_evidence: list[EvidenceItem] = Field(
        default_factory=list
    )
    contradicting_evidence: list[EvidenceItem] = Field(
        default_factory=list
    )
    missing_evidence: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)

    # Additional semantic verification fields
    contextual_evidence: list[EvidenceItem] = Field(
        default_factory=list
    )
    requires_human_review: bool = True

    # Classification status and error handling
    classification_status: Literal[
        "completed",
        "incomplete",
        "unavailable",
        "no_sources",
    ] = "unavailable"

    classification_reason: Optional[str] = None


class EvidenceAnalysisResponse(BaseModel):
    results: list[ClaimEvidenceResult] = Field(default_factory=list)
    analysis_type: str = "preliminary_evidence_mapping"
    limitations: list[str] = Field(default_factory=list)
    summary: str = ""
