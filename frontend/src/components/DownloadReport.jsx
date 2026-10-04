
import React, { useState } from "react";
import { downloadReportPDF } from "../services/reportService";

function DownloadReport({ reportData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownload = async () => {
    if (!reportData) {
      setError("Report data is not available.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await downloadReportPDF(reportData);
      setSuccess("Your report is ready for download.");
    } catch (err) {
      setError(err.message || "PDF download failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-report">
      <button
        type="button"
        className="download-report-button"
        onClick={handleDownload}
        disabled={loading || !reportData}
      >
        {loading ? (
          <>
            <span className="download-spinner" />
            Generating PDF...
          </>
        ) : (
          <>
            <span aria-hidden="true">↓</span>
            Download PDF
          </>
        )}
      </button>

      {error && (
        <p className="report-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="report-success" role="status">
          {success}
        </p>
      )}
    </div>
  );
}

export default DownloadReport;
