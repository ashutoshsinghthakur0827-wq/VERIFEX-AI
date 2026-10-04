
from pydantic import BaseModel, Field


class Claim(BaseModel):
    claim_text: str
    claim_type: str = "general"
    entities: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    financial_figures: list[str] = Field(default_factory=list)


class Indicator(BaseModel):
    name: str
    reason: str
    evidence_quote: str = ""


class ClaimAnalysisResponse(BaseModel):
    summary: str
    claims: list[Claim]
    potential_indicators: list[Indicator]
    missing_information: list[str]
    limitations: list[str]
    analysis_status: str = "claim_extraction_only"