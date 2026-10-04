
const API_BASE_URL = "http://127.0.0.1:8000";

export async function downloadReportPDF(reportData) {
  if (!reportData || !reportData.verification) {
    throw new Error("Verification data is missing");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/report/download-pdf`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    }
  );

  if (!response.ok) {
    let message = "Unable to generate PDF report";

    try {
      const errorData = await response.json();
      message =
        typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail || errorData);
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/pdf")) {
    throw new Error("The server did not return a PDF file");
  }

  const pdfBlob = await response.blob();

  if (pdfBlob.size === 0) {
    throw new Error("The generated PDF is empty");
  }

  const pdfUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");

  link.href = pdfUrl;
  link.download = "Verifex-AI-Verification-Report.pdf";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(pdfUrl);
  }, 1000);
}
