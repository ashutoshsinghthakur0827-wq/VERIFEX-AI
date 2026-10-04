
from io import BytesIO
from xml.sax.saxutils import escape
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)


def safe_text(value: Any) -> str:
    """Escape content before inserting it into a PDF Paragraph."""
    if value is None:
        return "Not provided"
    return escape(str(value)).replace("\n", "<br/>")


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(
        20 * mm,
        12 * mm,
        "Verifex AI | Preliminary Investigation Report"
    )
    canvas.drawRightString(
        190 * mm,
        12 * mm,
        f"Page {doc.page}"
    )
    canvas.restoreState()


def generate_pdf_report(report: dict[str, Any]) -> BytesIO:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title=str(report.get("title", "Verifex AI Report")),
        author="Verifex AI",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "VerifexTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=23,
        leading=29,
        textColor=colors.HexColor("#172554"),
        alignment=TA_CENTER,
        spaceAfter=12,
    )

    subtitle_style = ParagraphStyle(
        "VerifexSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#475569"),
        alignment=TA_CENTER,
        spaceAfter=18,
    )

    heading_style = ParagraphStyle(
        "VerifexHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True,
    )

    subheading_style = ParagraphStyle(
        "VerifexSubheading",
        parent=styles["Heading3"],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#334155"),
        spaceBefore=7,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "VerifexBody",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=5,
        wordWrap="CJK",
    )

    small_style = ParagraphStyle(
        "VerifexSmall",
        parent=body_style,
        fontSize=8,
        leading=11,
    )

    story = []

    title = report.get(
        "title",
        "Verifex AI Investigation"
    )

    story.append(Spacer(1, 25 * mm))
    story.append(Paragraph("VERIFEX AI", title_style))
    story.append(
        Paragraph(
            "PRELIMINARY INVESTIGATION REPORT",
            subtitle_style
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            f"<b>Investigation:</b> {safe_text(title)}",
            body_style
        )
    )
    story.append(
        Paragraph(
            f"<b>Generated at:</b> "
            f"{safe_text(report.get('generated_at'))}",
            body_style
        )
    )
    story.append(
        Paragraph(
            f"<b>Analysis type:</b> "
            f"{safe_text(report.get('analysis_type'))}",
            body_style
        )
    )

    summary = report.get("summary", {})
    summary_data = [
        [
            Paragraph("<b>Total claims</b>", body_style),
            Paragraph(
                safe_text(summary.get("total_claims", 0)),
                body_style
            ),
        ],
        [
            Paragraph("<b>Overall status</b>", body_style),
            Paragraph(
                safe_text(summary.get(
                    "overall_status",
                    "preliminary_review"
                )),
                body_style
            ),
        ],
        [
            Paragraph("<b>Human review</b>", body_style),
            Paragraph(
                "Required" if summary.get(
                    "human_review_required", True
                ) else "Not specified",
                body_style
            ),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[55 * mm, 105 * mm],
        hAlign="LEFT",
    )
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1),
         colors.HexColor("#eff6ff")),
        ("BOX", (0, 0), (-1, -1), 0.6,
         colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4,
         colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("Investigation Summary", heading_style))
    story.append(summary_table)
    story.append(Spacer(1, 5 * mm))

    results = report.get("results", [])

    story.append(Paragraph("Claim Analysis", heading_style))

    if not results:
        story.append(
            Paragraph(
                "No claim results were included in this report.",
                body_style
            )
        )

    for index, item in enumerate(results, start=1):
        claim_block = []

        claim_block.append(
            Paragraph(
                f"Claim {index}: "
                f"{safe_text(item.get('claim_text'))}",
                subheading_style
            )
        )

        claim_block.append(
            Paragraph(
                f"<b>Assessment:</b> "
                f"{safe_text(item.get('assessment'))}",
                body_style
            )
        )
        claim_block.append(
            Paragraph(
                f"<b>Confidence:</b> "
                f"{safe_text(item.get('confidence'))}",
                body_style
            )
        )
        claim_block.append(
            Paragraph(
                f"<b>Reasoning:</b> "
                f"{safe_text(item.get('reasoning'))}",
                body_style
            )
        )

        evidence_groups = [
            ("Supporting Evidence", "supporting_evidence"),
            ("Contradicting Evidence", "contradicting_evidence"),
            ("Contextual Evidence", "contextual_evidence"),
        ]

        for group_title, key in evidence_groups:
            entries = item.get(key, [])

            claim_block.append(
                Paragraph(group_title, styles["Heading4"])
            )

            if not entries:
                claim_block.append(
                    Paragraph("None provided.", small_style)
                )
                continue

            for evidence_index, evidence in enumerate(
                entries, start=1
            ):
                if not isinstance(evidence, dict):
                    continue

                claim_block.append(
                    Paragraph(
                        f"<b>Evidence {evidence_index}:</b> "
                        f"{safe_text(evidence.get('source_title'))}",
                        small_style
                    )
                )
                claim_block.append(
                    Paragraph(
                        f"<b>Excerpt:</b> "
                        f"{safe_text(evidence.get('evidence_excerpt'))}",
                        small_style
                    )
                )

                url = evidence.get("source_url", "")
                if url:
                    claim_block.append(
                        Paragraph(
                            f"<b>Source URL:</b> "
                            f"{safe_text(url)}",
                            small_style
                        )
                    )

                explanation = evidence.get("explanation", "")
                if explanation:
                    claim_block.append(
                        Paragraph(
                            f"<b>Explanation:</b> "
                            f"{safe_text(explanation)}",
                            small_style
                        )
                    )

                claim_block.append(Spacer(1, 2 * mm))

        for label, key in [
            ("Uncertainty", "uncertainty"),
            ("Source Limitations", "source_limitations"),
        ]:
            claim_block.append(
                Paragraph(label, styles["Heading4"])
            )
            values = item.get(key, [])

            if values:
                for value in values:
                    claim_block.append(
                        Paragraph(
                            f"&bull; {safe_text(value)}",
                            small_style
                        )
                    )
            else:
                claim_block.append(
                    Paragraph("None specified.", small_style)
                )

        claim_block.append(
            Paragraph(
                "<b>Human review required:</b> "
                + (
                    "Yes"
                    if item.get("human_review_required", True)
                    else "Not specified"
                ),
                body_style
            )
        )

        story.append(KeepTogether(claim_block))
        story.append(Spacer(1, 5 * mm))

    story.append(
        Paragraph("Report Limitations", heading_style)
    )

    limitations = report.get("limitations", [])
    if limitations:
        for limitation in limitations:
            story.append(
                Paragraph(
                    f"&bull; {safe_text(limitation)}",
                    body_style
                )
            )
    else:
        story.append(
            Paragraph("No limitations provided.", body_style)
        )

    review_notes = report.get("review_notes", [])
    if review_notes:
        story.append(
            Paragraph("Human Review Checklist", heading_style)
        )
        for note in review_notes:
            story.append(
                Paragraph(
                    f"&bull; {safe_text(note)}",
                    body_style
                )
            )

    story.append(
        Paragraph("Disclaimer", heading_style)
    )
    story.append(
        Paragraph(
            safe_text(report.get(
                "disclaimer",
                "This report is preliminary and requires human review."
            )),
            body_style
        )
    )

    doc.build(
        story,
        onFirstPage=add_page_number,
        onLaterPages=add_page_number,
    )

    buffer.seek(0)
    return buffer