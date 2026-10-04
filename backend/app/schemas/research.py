from pydantic import BaseModel, Field


class ResearchSource(BaseModel):
    title: str
    url: str
    excerpt: str = ""
    score: float | None = None
    published_date: str | None = None
    retrieved_at: str


class ClaimResearch(BaseModel):
    claim_text: str
    search_query: str
    sources: list[ResearchSource] = Field(default_factory=list)
    status: str = "completed"
    message: str = ""


class ResearchResponse(BaseModel):
    results: list[ClaimResearch] = Field(default_factory=list)
    research_status: str = "source_retrieval_only"
    limitations: list[str] = Field(default_factory=list)