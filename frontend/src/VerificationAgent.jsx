
import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  LoaderCircle,
  SearchCheck,
  FileSearch,
  UserRoundCheck,
  RefreshCw,
} from "lucide-react";
import "./VerificationAgent.css";

function VerificationAgent({
  claims = [],
  evidenceResults,
  onResults,
  apiUrl = "http://127.0.0.1:8000/api/verification/analyze",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  // Get claim text whether claim is a string or object.
  const getClaimText = (claim) => {
    if (typeof claim === "string") return claim;

    return (
      claim?.claim_text ||
      claim?.text ||
      claim?.claim ||
      claim?.statement ||
      ""
    );
  };

  // Handle different Evidence Agent response formats.
  const getEvidenceData = () => {
    if (!evidenceResults) return null;

    return (
      evidenceResults?.evidence_analysis ||
      evidenceResults?.evidenceAnalysis ||
      evidenceResults?.data?.evidence_analysis ||
      evidenceResults?.data ||
      evidenceResults
    );
  };

  const getEvidenceRecords = () => {
    const data = getEvidenceData();

    if (!data) return [];
    if (Array.isArray(data)) return data;

    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.claims)) return data.claims;
    if (Array.isArray(data.evidence_results)) {
      return data.evidence_results;
    }
    if (Array.isArray(data.evidence)) return data.evidence;

    return [];
  };

  // Normalize evidence fields for the backend.
  const normalizeEvidence = (item) => {
    if (typeof item === "string") {
      return {
        source_title: "",
        source_url: "",
        evidence_excerpt: item,
        relevance: 0,
        matching_terms: [],
        explanation: "",
        stance: "requires_review",
        source_reliability: "unassessed",
      };
    }

    return {
      source_title: item?.source_title || item?.title || "",
      source_url: item?.source_url || item?.url || "",
      evidence_excerpt:
        item?.evidence_excerpt ||
        item?.excerpt ||
        item?.text ||
        item?.description ||
        "",
      relevance: item?.relevance ?? item?.score ?? 0,
      matching_terms: Array.isArray(item?.matching_terms)
        ? item.matching_terms
        : [],
      explanation: item?.explanation || "",
      stance: [
        "supports",
        "contradicts",
        "context",
        "unrelated",
        "requires_review",
      ].includes(item?.stance)
        ? item.stance
        : "requires_review",
      source_reliability: [
        "high",
        "moderate",
        "low",
        "unassessed",
      ].includes(item?.source_reliability)
        ? item.source_reliability
        : "unassessed",
    };
  };

  // Find evidence belonging to a particular claim.
  const getEvidenceForClaim = (claim, index) => {
    const claimText = getClaimText(claim).trim();

    // Use evidence already attached to the claim, if present.
    if (Array.isArray(claim?.evidence) && claim.evidence.length > 0) {
      return {
        evidence: claim.evidence.map(normalizeEvidence),
        source_assessments: Array.isArray(claim?.source_assessments)
          ? claim.source_assessments
          : [],
        evidence_status: claim?.evidence_status || "requires_review",
        explanation: claim?.explanation || "",
      };
    }

    const records = getEvidenceRecords();

    // Match evidence record by claim text.
    const matchedRecord = records.find((record) => {
      const recordText =
        record?.claim_text ||
        record?.claim ||
        record?.text ||
        record?.statement ||
        "";

      return (
        String(recordText).trim().toLowerCase() ===
        claimText.toLowerCase()
      );
    });

    // Use index only when both arrays have the same number of items.
    const record =
      matchedRecord ||
      (records.length === claims.length ? records[index] : null);

    const rawEvidence = Array.isArray(record?.evidence)
      ? record.evidence
      : Array.isArray(record?.results)
        ? record.results
        : Array.isArray(record?.supporting_evidence)
          ? record.supporting_evidence
          : [];

    const sourceAssessments = Array.isArray(record?.source_assessments)
      ? record.source_assessments
      : [];

    return {
      evidence: rawEvidence.map(normalizeEvidence),
      source_assessments: sourceAssessments,
      evidence_status:
        record?.evidence_status ||
        record?.assessment ||
        "requires_review",
      explanation: record?.explanation || "",
    };
  };

  // Send claims to the Verification Agent in batches of 10.
  const handleVerify = async () => {
    setError("");
    setResults(null);

    const validClaims = claims
      .map((claim, index) => {
        const claimText = getClaimText(claim).trim();

        if (!claimText) return null;

        const evidenceData = getEvidenceForClaim(claim, index);

        return {
          claim_text: claimText,
          evidence: evidenceData.evidence,
          source_assessments: evidenceData.source_assessments,
          evidence_status: evidenceData.evidence_status,
          explanation: evidenceData.explanation,
        };
      })
      .filter(Boolean);

    if (validClaims.length === 0) {
      setError(
        "No valid claims are available. Complete Claim Analysis first."
      );
      return;
    }

    if (!evidenceResults) {
      setError("Complete Evidence Analysis before verification.");
      return;
    }

    const hasEvidence = validClaims.some((claim) =>
      claim.evidence.some(
        (item) =>
          typeof item.evidence_excerpt === "string" &&
          item.evidence_excerpt.trim().length > 0
      )
    );

    if (!hasEvidence) {
      setError(
        "No evidence excerpts were found for these claims. Check the Evidence Agent results."
      );
      return;
    }

    // Helpful debugging information in the browser console.
    console.log("Claims sent for verification:", validClaims);

    console.log(
      "Evidence excerpts:",
      validClaims.map((claim) => ({
        claim_text: claim.claim_text,
        excerpts: claim.evidence.map(
          (item) => item.evidence_excerpt
        ),
      }))
    );

    setLoading(true);

    try {
      const batchSize = 10;
      const allResults = [];
      const allLimitations = [];
      let analysisType = "preliminary_ai_evidence_interpretation";
      let humanReviewRequired = true;

      for (let i = 0; i < validClaims.length; i += batchSize) {
        const batch = validClaims.slice(i, i + batchSize);

        console.log(
          `Sending verification batch ${Math.floor(i / batchSize) + 1}:`,
          batch
        );

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            claims: batch,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const detail =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail || data);

          throw new Error(
            detail || "Verification request failed."
          );
        }

        const verificationData = data?.verification;

        if (
          !verificationData ||
          !Array.isArray(verificationData.results)
        ) {
          throw new Error(
            "Invalid backend response. Expected verification.results."
          );
        }

        allResults.push(...verificationData.results);

        if (Array.isArray(verificationData.limitations)) {
          allLimitations.push(...verificationData.limitations);
        }

        if (verificationData.analysis_type) {
          analysisType = verificationData.analysis_type;
        }

        if (verificationData.human_review_required === false) {
          humanReviewRequired = false;
        }
      }

      // Combine all batch responses into one result.
      const combinedResults = {
        results: allResults,
        limitations: [...new Set(allLimitations)],
        analysis_type: analysisType,
        human_review_required: humanReviewRequired,
      };

      console.log("Combined verification results:", combinedResults);

      setResults(combinedResults);
      onResults?.(combinedResults);
    } catch (err) {
      console.error("Verification error:", err);

      setError(
        err?.message ||
          "Unable to connect to the Verification Agent. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const verificationItems = Array.isArray(results?.results)
    ? results.results
    : [];

  const asArray = (value) =>
    Array.isArray(value) ? value : [];

  // Convert evidence objects into readable text.
  const formatEvidence = (item) => {
    if (typeof item === "string") return item;

    return (
      item?.evidence_excerpt ||
      item?.excerpt ||
      item?.explanation ||
      item?.text ||
      item?.description ||
      item?.source_title ||
      item?.title ||
      "Evidence details are not available."
    );
  };

  const getStatus = (item) =>
    item?.assessment ||
    item?.verification_status ||
    item?.status ||
    "requires_review";

  const getConfidence = (item) => {
    const confidence = item?.confidence;

    if (
      confidence === null ||
      confidence === undefined ||
      confidence === ""
    ) {
      return "Not assessed";
    }

    if (typeof confidence === "number") {
      return confidence <= 1
        ? `${Math.round(confidence * 100)}%`
        : `${confidence}%`;
    }

    return String(confidence);
  };

  const getReviewRequired = (item) =>
    item?.human_review_required ??
    item?.requires_human_review ??
    true;

  // Render evidence list with source links.
  const renderEvidenceList = (items, emptyMessage) => {
    const list = asArray(items);

    if (list.length === 0) {
      return (
        <p className="verification-empty">
          {emptyMessage}
        </p>
      );
    }

    return (
      <ul className="verification-evidence-list">
        {list.map((evidence, index) => {
          const text = formatEvidence(evidence);
          const sourceUrl =
            typeof evidence === "object"
              ? evidence?.source_url || evidence?.url
              : "";

          return (
            <li key={`${sourceUrl || "evidence"}-${index}`}>
              <span>{text}</span>

              {sourceUrl && (
                <>
                  {" "}
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="verification-source-link"
                  >
                    View source
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="verification-panel">
      <div className="verification-heading">
        <div className="verification-icon">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h2>Verification Agent</h2>
          <p>
            Examine available evidence, assess uncertainty,
            and identify review requirements.
          </p>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="verification-empty-state">
          <FileSearch size={34} />
          <h3>No claims available</h3>
          <p>
            Complete Claim Analysis first to prepare claims
            for verification.
          </p>
        </div>
      ) : (
        <div className="verification-content">
          <div className="verification-overview">
            <div className="verification-overview-icon">
              <FileSearch size={21} />
            </div>

            <div>
              <strong>{claims.length} claim(s) ready</strong>
              <p>
                {evidenceResults
                  ? "Evidence results are available for review."
                  : "Complete Evidence Analysis before verification."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="verification-button"
            onClick={handleVerify}
            disabled={loading || !evidenceResults}
          >
            {loading ? (
              <>
                <LoaderCircle
                  className="verification-spinner"
                  size={19}
                />
                Analyzing evidence...
              </>
            ) : results ? (
              <>
                <RefreshCw size={18} />
                Verify Again
              </>
            ) : (
              <>
                <SearchCheck size={19} />
                Verify Claims
              </>
            )}
          </button>

          {error && (
            <div
              className="verification-error"
              role="alert"
            >
              <AlertTriangle size={19} />
              <span>{error}</span>
            </div>
          )}

          {results && (
            <div className="verification-results">
              <div className="verification-results-heading">
                <div>
                  <h3>Verification Results</h3>
                  <p>
                    Preliminary assessment based on available
                    evidence.
                  </p>
                </div>

                <ShieldCheck size={23} />
              </div>

              {verificationItems.length === 0 && (
                <div className="verification-error">
                  No individual claim results were returned.
                  Check the backend response format.
                </div>
              )}

              {verificationItems.map((item, index) => {
                const status = getStatus(item);

                const normalizedStatus = String(status)
                  .toLowerCase()
                  .replaceAll("_", "-")
                  .replaceAll(" ", "-");

                const supporting = asArray(
                  item?.supporting_evidence
                );

                const contradicting = asArray(
                  item?.contradicting_evidence
                );

                const contextual = asArray(
                  item?.contextual_evidence
                );

                const uncertainty = asArray(
                  item?.uncertainty || item?.uncertainties
                );

                const limitations = asArray(
                  item?.source_limitations ||
                    item?.limitations
                );

                const reviewRequired =
                  getReviewRequired(item);

                return (
                  <div
                    className="verification-result-card"
                    key={`${item?.claim_text || "claim"}-${index}`}
                  >
                    <div className="verification-result-top">
                      <span className="verification-claim-number">
                        CLAIM {index + 1}
                      </span>

                      <span
                        className={`verification-status ${normalizedStatus}`}
                      >
                        {String(status).replaceAll("_", " ")}
                      </span>
                    </div>

                    <h4 className="verification-claim">
                      {item?.claim_text ||
                        item?.claim ||
                        "Claim text unavailable"}
                    </h4>

                    <div className="verification-metrics">
                      <div className="verification-metric">
                        <span>Confidence</span>
                        <strong>
                          {getConfidence(item)}
                        </strong>
                      </div>

                      <div className="verification-metric">
                        <span>Human review</span>
                        <strong>
                          {reviewRequired
                            ? "Required"
                            : "Not flagged"}
                        </strong>
                      </div>
                    </div>

                    {item?.reasoning && (
                      <div className="verification-explanation">
                        <h5>Assessment</h5>
                        <p>{item.reasoning}</p>
                      </div>
                    )}

                    <div className="verification-section">
                      <h5>
                        <ShieldCheck size={17} />
                        Supporting Evidence
                      </h5>

                      {renderEvidenceList(
                        supporting,
                        "No supporting evidence was identified by the backend."
                      )}
                    </div>

                    <div className="verification-section">
                      <h5>
                        <AlertTriangle size={17} />
                        Contradicting Evidence
                      </h5>

                      {renderEvidenceList(
                        contradicting,
                        "No contradicting evidence was identified by the backend."
                      )}
                    </div>

                    <div className="verification-section">
                      <h5>Contextual Evidence</h5>

                      {renderEvidenceList(
                        contextual,
                        "No contextual evidence was returned."
                      )}
                    </div>

                    <div className="verification-section">
                      <h5>Uncertainty</h5>

                      {renderEvidenceList(
                        uncertainty,
                        "No uncertainty details were returned."
                      )}
                    </div>

                    <div className="verification-section">
                      <h5>Source Limitations</h5>

                      {renderEvidenceList(
                        limitations,
                        "No source limitations were returned."
                      )}
                    </div>

                    <div className="verification-review-note">
                      <UserRoundCheck size={18} />
                      <span>
                        {reviewRequired
                          ? "Human review is required before relying on this assessment."
                          : "Review the original sources and limitations before relying on this assessment."}
                      </span>
                    </div>
                  </div>
                );
              })}

              {asArray(results?.limitations).length > 0 && (
                <div className="verification-global-limitations">
                  <h4>Overall Limitations</h4>

                  {renderEvidenceList(
                    results.limitations,
                    "No overall limitations returned."
                  )}
                </div>
              )}
            </div>
          )}

          <div className="verification-disclaimer">
            <AlertTriangle size={17} />
            <p>
              This is a preliminary automated assessment,
              not a guarantee of truth or falsity. Textual
              similarity alone does not prove that a claim
              is supported or contradicted. Review the
              original sources and use human judgment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationAgent;