
import { useState } from "react";
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  ListChecks,
  FileSearch,
  LoaderCircle,
} from "lucide-react";

import ResearchAgent from "./ResearchAgent";
import "./ClaimAnalysis.css";

const API_URL = "http://127.0.0.1:8000";

export default function ClaimAnalysis({
  content = "",
  setContent = () => {},
  onClaimsExtracted,
  onResearchResults,
}) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    if (!content.trim()) {
      setError("Please submit some text for analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    // Clear old claims and downstream results
    onClaimsExtracted?.([]);

    try {
      const response = await fetch(`${API_URL}/api/claims/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Claim analysis failed."
        );
      }

      if (!data?.analysis || typeof data.analysis !== "object") {
        throw new Error(
          "The server returned an invalid analysis response."
        );
      }

      const extractedClaims = Array.isArray(data.analysis.claims)
        ? data.analysis.claims.filter(
            (claim) =>
              typeof claim?.claim_text === "string" &&
              claim.claim_text.trim().length > 0
          )
        : [];

      // Store analysis for displaying results
      setAnalysis(data.analysis);

      // Send extracted claims to App.jsx
      onClaimsExtracted?.(extractedClaims);
    } catch (err) {
      setError(err?.message || "Unable to analyze this content.");
      onClaimsExtracted?.([]);
    } finally {
      setLoading(false);
    }
  }

  const claims = Array.isArray(analysis?.claims)
    ? analysis.claims.filter(
        (claim) =>
          typeof claim?.claim_text === "string" &&
          claim.claim_text.trim().length > 0
      )
    : [];

  const indicators = Array.isArray(analysis?.potential_indicators)
    ? analysis.potential_indicators
    : [];

  const missingInformation = Array.isArray(
    analysis?.missing_information
  )
    ? analysis.missing_information
    : [];

  const limitations = Array.isArray(analysis?.limitations)
    ? analysis.limitations
    : [];

  return (
    <section className="claim-analysis-panel">
      <div className="claim-analysis-heading">
        <div className="claim-analysis-title-icon">
          <BrainCircuit size={22} />
        </div>

        <div>
          <h2>Claim Analysis Agent</h2>
          <p>
            Extract checkable claims and potential indicators from
            submitted content.
          </p>
        </div>
      </div>

      <label
        className="claim-analysis-label"
        htmlFor="claim-content"
      >
        Content to analyze
      </label>

      <textarea
        id="claim-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={6}
        maxLength={20000}
        placeholder="Paste a financial message, news article, investment offer, or text extracted from a document..."
      />

      <div className="claim-analysis-actions">
        <span>{content.length} / 20,000 characters</span>

        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <>
              <LoaderCircle
                size={17}
                className="claim-spinner"
              />
              Analyzing...
            </>
          ) : (
            <>
              <Search size={17} />
              Analyze Claims
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="claim-analysis-error" role="alert">
          <AlertTriangle size={16} />
          {error}
        </p>
      )}

      {analysis && (
        <div className="claim-analysis-results">
          <div className="claim-analysis-summary">
            <h3>Analysis Summary</h3>
            <p>
              {analysis.summary || "No summary was provided."}
            </p>
            <span className="claim-analysis-note">
              Claim extraction only — this is not a fraud
              determination or a verification result.
            </span>
          </div>

          <div className="claim-result-section">
            <h3>
              <ListChecks size={18} />
              Checkable Claims
            </h3>

            {claims.length > 0 ? (
              claims.map((claim, index) => (
                <article
                  className="claim-result-card"
                  key={`${index}-${claim.claim_text}`}
                >
                  <strong>Claim {index + 1}</strong>
                  <p>{claim.claim_text}</p>

                  {claim.claim_type && (
                    <small>Type: {claim.claim_type}</small>
                  )}

                  {Array.isArray(claim.entities) &&
                    claim.entities.length > 0 && (
                      <p>
                        <b>Entities:</b>{" "}
                        {claim.entities.join(", ")}
                      </p>
                    )}

                  {Array.isArray(claim.dates) &&
                    claim.dates.length > 0 && (
                      <p>
                        <b>Dates:</b> {claim.dates.join(", ")}
                      </p>
                    )}

                  {Array.isArray(claim.financial_figures) &&
                    claim.financial_figures.length > 0 && (
                      <p>
                        <b>Financial Figures:</b>{" "}
                        {claim.financial_figures.join(", ")}
                      </p>
                    )}
                </article>
              ))
            ) : (
              <p>No checkable claims were extracted.</p>
            )}
          </div>

          <div className="claim-result-section">
            <h3>
              <AlertTriangle size={18} />
              Potential Indicators
            </h3>

            {indicators.length > 0 ? (
              indicators.map((item, index) => (
                <article
                  className="claim-result-card"
                  key={`${index}-${item.name || "indicator"}`}
                >
                  <strong>
                    {item.name || `Indicator ${index + 1}`}
                  </strong>
                  <p>
                    {item.reason || "No explanation provided."}
                  </p>

                  {item.evidence_quote && (
                    <small>
                      Related text: “{item.evidence_quote}”
                    </small>
                  )}
                </article>
              ))
            ) : (
              <p>
                No potential indicators were identified by the model.
              </p>
            )}

            <p className="claim-analysis-note">
              An indicator is a signal for further review, not
              proof of fraud or misinformation.
            </p>
          </div>

          <div className="claim-result-section">
            <h3>Missing Information</h3>

            {missingInformation.length > 0 ? (
              <ul>
                {missingInformation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No missing information was listed.</p>
            )}
          </div>

          <div className="claim-result-section">
            <h3>Limitations</h3>

            {limitations.length > 0 ? (
              <ul>
                {limitations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>
                No limitations were returned by the model.
              </p>
            )}
          </div>

          <div className="claim-result-section research-integration">
            <h3>
              <FileSearch size={18} />
              Research Extracted Claims
            </h3>

            <p>
              Search for relevant sources related to the extracted
              claims. Retrieved sources are research leads and
              require further evidence assessment.
            </p>

            {claims.length > 0 ? (
              <ResearchAgent
                claims={claims}
                onResults={onResearchResults}
              />
            ) : (
              <p>
                No extracted claims are available to research.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}