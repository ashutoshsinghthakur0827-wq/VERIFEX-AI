
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.report import (
    ReportRequest,
    ReportResponse,
)
from app.graph.report_graph import report_graph
from app.services.pdf_report import generate_pdf_report


router = APIRouter(
    prefix="/api/report",
    tags=["Report Agent"]
)


def build_report(payload: ReportRequest) -> dict:
    output = report_graph.invoke({
        "investigation_title": payload.investigation_title,
        "verification": payload.verification,
        "include_review_notes": payload.include_review_notes,
    })

    report = output.get("report")

    if not isinstance(report, dict):
        raise ValueError("Report generation returned no report.")

    return report


@router.post(
    "/generate",
    response_model=ReportResponse
)
async def generate_investigation_report(
    payload: ReportRequest
):
    try:
        report = build_report(payload)

        return ReportResponse(
            message="Preliminary investigation report generated.",
            report=report,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Report generation failed: "
                f"{type(exc).__name__}"
            )
        )


@router.post("/download-pdf")
async def download_pdf_report(
    payload: ReportRequest
):
    try:
        report = build_report(payload)
        pdf_buffer = generate_pdf_report(report)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    'attachment; filename="verifex_report.pdf"'
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "PDF generation failed: "
                f"{type(exc).__name__}"
            )
        )