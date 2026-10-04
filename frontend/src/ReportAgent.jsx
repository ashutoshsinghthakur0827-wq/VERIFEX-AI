
import React, { useMemo, useState } from "react";
import DownloadReport from "./components/DownloadReport.jsx";
import "./ReportAgent.css";

// Extract arrays from direct or nested API responses
function extractArray(value, keys, depth = 0) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object" || depth > 4) {
    return [];
  }

  // Look for known array properties first
  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  // Search common nested response objects
  const nestedKeys = [
    "data",
    "result",
    "verification",
    "evidence_analysis",
    "research",
    "report",
  ];

  for (const key of nestedKeys) {
    if (value[key] && typeof value[key] === "object") {
      const result = extractArray(
        value[key],
        keys,
        depth + 1
      );

      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
}

function ReportAgent({
  claims = [],
  researchResults = [],
  evidenceResults = null,
  verificationResults = null,
  investigationTitle = "Verifex AI Investigation",
  theme = "dark",
  onReportGenerated,
}) {
  const [showPreview, setShowPreview] = useState(false);

  // Normalize the data received from the parent component
  const safeClaims = useMemo(
    () =>
      extractArray(claims, [
        "claims",
        "results",
      ]),
    [claims]
  );

  const safeResearch = useMemo(
    () =>
      extractArray(researchResults, [
        "research_results",
        "results",
        "sources",
        "research",
      ]),
    [researchResults]
  );

  const safeEvidence = useMemo(
    () =>
      extractArray(evidenceResults, [
        "evidence_results",
        "evidence_analysis",
        "results",
        "claim_results",
        "analyses",
      ]),
    [evidenceResults]
  );

  const safeVerification = useMemo(
    () =>
      extractArray(verificationResults, [
        "verification_results",
        "results",
        "claim_results",
      ]),
    [verificationResults]
  );

  // Prepare the data expected by the backend report endpoint
  const reportData = useMemo(
    () => ({
      investigation_title: investigationTitle,
      verification: {
        claims: safeClaims,
        research_results: safeResearch,
        evidence_results: safeEvidence,
        verification_results: safeVerification,
      },
      include_review_notes: true,
    }),
    [
      investigationTitle,
      safeClaims,
      safeResearch,
      safeEvidence,
      safeVerification,
    ]
  );

  // Prepare report data for preview and download
  const handlePrepareReport = () => {
    if (typeof onReportGenerated === "function") {
      onReportGenerated(reportData);
    }

    setShowPreview(true);
  };

  // Check whether the investigation has usable data
  const hasData =
    safeClaims.length > 0 ||
    safeResearch.length > 0 ||
    safeEvidence.length > 0 ||
    safeVerification.length > 0;

  return (
    <section
      className={`report-agent ${
        theme === "light" ? "light" : "dark"
      }`}
    >
      {/* Report header */}
      <div className="report-header">
        <div className="report-heading">
          <span className="report-eyebrow">
            VERIFEX AI / REPORTING SYSTEM
          </span>

          <h2>Investigation Report</h2>

          <p>
            Review the collected information and prepare
            your evidence-grounded verification report.
          </p>
        </div>

        <div className="report-icon" aria-hidden="true">
          <span>▤</span>
        </div>
      </div>

      <div className="report-divider" />

      {/* Report status */}
      <div className="report-status">
        <span className="status-dot" />
        Report data overview
      </div>

      {/* Data statistics */}
      <div className="report-stats">
        <div className="report-stat">
          <span className="stat-icon">⌕</span>
          <span className="stat-label">Claims</span>
          <strong>{safeClaims.length}</strong>
        </div>

        <div className="report-stat">
          <span className="stat-icon">◎</span>
          <span className="stat-label">Research</span>
          <strong>{safeResearch.length}</strong>
        </div>

        <div className="report-stat">
          <span className="stat-icon">◈</span>
          <span className="stat-label">Evidence</span>
          <strong>{safeEvidence.length}</strong>
        </div>

        <div className="report-stat">
          <span className="stat-icon">✓</span>
          <span className="stat-label">Verification</span>
          <strong>{safeVerification.length}</strong>
        </div>
      </div>

      {/* Report details */}
      <div className="report-details">
        <span className="details-label">
          Report title
        </span>

        <strong>{investigationTitle}</strong>

        <p>
          The backend report agent prepares a structured
          report from the information supplied by the
          investigation stages.
        </p>
      </div>

      {/* Data availability warning */}
      {!hasData && (
        <div className="workflow-note">
          No investigation data is currently available.
          Complete the earlier stages before preparing
          your report.
        </div>
      )}

      {(safeEvidence.length === 0 ||
        safeVerification.length === 0) &&
        hasData && (
          <div className="workflow-note">
            Some investigation stages have not supplied
            results. The report may be incomplete. Review
            the evidence and verification stages before
            drawing conclusions.
          </div>
        )}

      {/* Report actions */}
      <div className="report-actions">
        <button
          type="button"
          className="prepare-report-button"
          onClick={handlePrepareReport}
          disabled={!hasData}
        >
          {showPreview
            ? "Refresh Report Data"
            : "Prepare Report Data"}
        </button>

        <DownloadReport reportData={reportData} />
      </div>

      {/* JSON preview */}
      {showPreview && (
        <div className="report-preview">
          <div className="preview-header">
            <h3>Request Data Preview</h3>

            <button
              type="button"
              className="preview-toggle"
              onClick={() => setShowPreview(false)}
            >
              Hide
            </button>
          </div>

          <pre>
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      )}

      {/* Responsible AI disclaimer */}
      <p className="report-disclaimer">
        The report is generated by the backend report
        agent. Verification findings are preliminary and
        should be reviewed against their underlying
        evidence. Missing results do not establish that
        a claim is true or false.
      </p>
    </section>
  );
}

export default ReportAgent;