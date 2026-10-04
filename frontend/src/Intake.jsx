
import React, { useState } from "react";
import "./Intake.css";

const API_BASE = "https://verifex-ai.onrender.com";

function Intake({ onContentReady }) {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // Handle the API response and extract submitted content.
  const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          `Request failed (${response.status})`
      );
    }

    const extracted =
      data.extracted_text ??
      data.content ??
      data.text ??
      data.result?.extracted_text ??
      data.result?.content ??
      data.result?.text ??
      "";

    if (typeof extracted !== "string" || !extracted.trim()) {
      throw new Error(
        "The server responded, but no extracted text was found. Check the API response format."
      );
    }

    onContentReady?.(extracted);
    setSuccess(
      "Content received successfully. You can now analyze the claims."
    );
  };

  // Submit text to the backend.
  const submitText = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!text.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/intake/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      await handleResponse(response);
    } catch (err) {
      setError(err.message || "Unable to process the text.");
    } finally {
      setLoading(false);
    }
  };

  // Submit a website URL to the backend.
  const submitUrl = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("Enter a valid URL, including https://");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/intake/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      await handleResponse(response);
    } catch (err) {
      setError(err.message || "Unable to process this URL.");
    } finally {
      setLoading(false);
    }
  };

  // Upload a document to the backend.
  const submitFile = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!file) {
      setError("Please select a document first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/intake/file`, {
        method: "POST",
        body: formData,
      });

      await handleResponse(response);
    } catch (err) {
      setError(err.message || "Unable to process this file.");
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    resetMessages();
  };

  return (
    <section className="intake-page">
      <div className="intake-heading">
        <div>
          <span className="intake-eyebrow">
            <span className="eyebrow-dot" />
            VERIFEX AI / CONTENT INTAKE
          </span>

          <h1>Start your analysis</h1>

          <p>
            Submit a claim, article, web link, or document to begin
            evidence-based research.
          </p>
        </div>

        <div className="intake-heading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="intake-layout">
        <main className="intake-main-card">
          <div className="intake-card-top">
            <div>
              <h2>Provide your content</h2>
              <p>Choose how you want to submit information.</p>
            </div>

            <span className="intake-step">
              STEP 01 <b>/ 04</b>
            </span>
          </div>

          <div
            className="intake-tabs"
            role="tablist"
            aria-label="Input type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "text"}
              className={activeTab === "text" ? "active" : ""}
              onClick={() => changeTab("text")}
            >
              <span className="tab-icon">T</span>
              Text
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "url"}
              className={activeTab === "url" ? "active" : ""}
              onClick={() => changeTab("url")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7M14 10.5a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 19.2l1.7-1.7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Website URL
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "file"}
              className={activeTab === "file" ? "active" : ""}
              onClick={() => changeTab("file")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-7-7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 3v7h7M8 15h8M8 18h6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Document
            </button>
          </div>

          {activeTab === "text" && (
            <form className="intake-form" onSubmit={submitText}>
              <label htmlFor="intake-text">Text or claim</label>

              <p className="field-description">
                Paste a statement, news excerpt, social post, or claim
                you want to examine.
              </p>

              <textarea
                id="intake-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter or paste your content here..."
                rows={9}
                maxLength={20000}
              />

              <div className="textarea-meta">
                <span>Keep the original wording where possible.</span>
                <span>{text.length.toLocaleString()} / 20,000</span>
              </div>

              <button
                className="intake-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Processing..." : "Continue to analysis"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}

          {activeTab === "url" && (
            <form className="intake-form" onSubmit={submitUrl}>
              <label htmlFor="intake-url">Website URL</label>

              <p className="field-description">
                Provide a publicly accessible article or webpage link.
              </p>

              <div className="url-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0-18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>

                <input
                  id="intake-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                />
              </div>

              <div className="intake-note">
                <span className="note-icon">i</span>
                Some websites block automated access. A URL may not
                always provide readable article text.
              </div>

              <button
                className="intake-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Fetching content..." : "Fetch and continue"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}

          {activeTab === "file" && (
            <form className="intake-form" onSubmit={submitFile}>
              <label htmlFor="intake-file">Upload a document</label>

              <p className="field-description">
                Upload a document or image for text extraction.
              </p>

              <label className="intake-dropzone" htmlFor="intake-file">
                <span className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <strong>
                  {file ? file.name : "Click to browse files"}
                </strong>

                <span>
                  {file
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Choose a PDF, DOCX, TXT, or supported image"}
                </span>

                <span className="browse-file">
                  {file ? "Choose another file" : "Browse files"}
                </span>

                <input
                  id="intake-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={(e) =>
                    setFile(e.target.files?.[0] || null)
                  }
                />
              </label>

              <div className="intake-note">
                <span className="note-icon">i</span>
                Only upload documents you have permission to use. File
                size limits depend on your backend configuration.
              </div>

              <button
                className="intake-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload and continue"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}

          {error && (
            <div className="intake-message intake-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div
              className="intake-message intake-success"
              role="status"
            >
              <span>✓</span>
              {success}
            </div>
          )}

          <div className="intake-privacy">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 10V7a4 4 0 1 1 8 0v3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>

            <span>
              Content is submitted to your configured Verifex AI
              backend for processing.
            </span>
          </div>
        </main>

        <aside className="intake-side">
          <div className="intake-info-card">
            <span className="side-card-kicker">YOUR WORKFLOW</span>

            <h3>From content to context</h3>

            <p>
              Your submission starts a structured process to identify
              claims and examine available evidence.
            </p>

            <div className="workflow-list">
              <div className="workflow-item current">
                <span className="workflow-number">01</span>
                <div>
                  <strong>Content intake</strong>
                  <small>Submit text, a URL, or a file</small>
                </div>
                <span className="workflow-indicator" />
              </div>

              <div className="workflow-item">
                <span className="workflow-number">02</span>
                <div>
                  <strong>Claim analysis</strong>
                  <small>Identify checkable statements</small>
                </div>
              </div>

              <div className="workflow-item">
                <span className="workflow-number">03</span>
                <div>
                  <strong>Research &amp; evidence</strong>
                  <small>Gather relevant source material</small>
                </div>
              </div>

              <div className="workflow-item">
                <span className="workflow-number">04</span>
                <div>
                  <strong>Verification report</strong>
                  <small>Summarize findings and uncertainty</small>
                </div>
              </div>
            </div>
          </div>

          <div className="intake-tip-card">
            <span className="tip-symbol">✳</span>

            <div>
              <strong>Research responsibly</strong>
              <p>
                AI-generated findings can be incomplete. Review
                sources and evidence before drawing conclusions.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Intake;
