
from typing import Any

from pydantic import BaseModel, Field, ConfigDict


class ReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    investigation_title: str = Field(
        default="Verifex AI Investigation",
        min_length=1,
        max_length=200,
    )

    verification: dict[str, Any] = Field(
        ...,
        description="Verification results and related investigation data",
    )

    include_review_notes: bool = True


class ReportResponse(BaseModel):
    message: str
    report: dict[str, Any]