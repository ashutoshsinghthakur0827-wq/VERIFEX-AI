
import { useState } from "react";
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  FileSearch,
  ShieldAlert,
  BookOpen,
} from "lucide-react";

import "./EvidenceAnalysis.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://verifex-ai.onrender.com";

export default function EvidenceAgent({
  claims = [],
  researchResults = [],
  onResults,
  theme = "dark",
}) {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getClaimText(claim) {
    if (typeof claim === "string") {
      return claim.trim();
    }

    if (typeof claim?.claim_text === "string") {
      return claim.claim_text.trim();
    }

    if (typeof claim?.text === "string") {
      return claim.text.trim();
    }

    return "";
  }

  function normalizeInputSource(source) {
    return {
      title:
        source.title ||
        source.source_title ||
        "Untitled source",
      url: source.url || source.source_url || "",
      excerpt:
        source.excerpt ||
        source.evidence_excerpt ||
        source.description ||
        "",
      published_date:
        source.published_date ||
        source.publication_date ||
        null,
      retrieved_at: source.retrieved_at || null,
      score:
        typeof source.score === "number"
          ? source.score
          : null,
    };
  }

  function getSources(claim) {
    const claimText = getClaimText(claim);

    if (
      Array.isArray(claim?.sources) &&
      claim.sources.length > 0
    ) {
      return claim.sources
        .filter(
          (source) =>
            source && typeof source === "object"
        )
        .slice(0, 10)
        .map(normalizeInputSource);
    }

    const matched = researchResults.find(
      (item) =>
        getClaimText(item).toLowerCase() ===
        claimText.toLowerCase()
    );

    return Array.isArray(matched?.sources)
      ? matched.sources
          .filter(
            (source) =>
              source && typeof source === "object"
          )
          .slice(0, 10)
          .map(normalizeInputSource)
      : [];
  }

  function isValidHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  function normalizeEvidenceResult(
    item,
    index,
    validClaims
  ) {
    const mappedEvidence = Array.isArray(item?.evidence)
      ? item.evidence
      : [];

    // Use explicit backend classifications whenever supplied.
    // If the classification arrays are missing, derive them
    // from the stance of the mapped evidence.
    const supportingEvidence = Array.isArray(
      item?.supporting_evidence
    )
      ? item.supporting_evidence
      : mappedEvidence.filter(
          (entry) => entry?.stance === "supports"
        );

    const contradictingEvidence = Array.isArray(
      item?.contradicting_evidence
    )
      ? item.contradicting_evidence
      : mappedEvidence.filter(
          (entry) => entry?.stance === "contradicts"
        );

    const contextualEvidence = Array.isArray(
      item?.contextual_evidence
    )
      ? item.contextual_evidence
      : mappedEvidence.filter(
          (entry) => entry?.stance === "context"
        );

    return {
      ...item,

      claim_text:
        item?.claim_text ||
        validClaims[index]?.claim_text ||
        "",

      assessment:
        item?.assessment ||
        item?.evidence_status ||
        "requires_review",

      evidence_summary:
        item?.evidence_summary ||
        item?.explanation ||
        "",

      classification_status:
        item?.classification_status ||
        (validClaims[index]?.sources?.length
          ? "incomplete"
          : "no_sources"),

      classification_reason:
        item?.classification_reason || null,

      evidence: mappedEvidence,
      supporting_evidence: supportingEvidence,
      contradicting_evidence: contradictingEvidence,
      contextual_evidence: contextualEvidence,

      missing_evidence: Array.isArray(
        item?.missing_evidence
      )
        ? item.missing_evidence
        : [],

      limitations: Array.isArray(item?.limitations)
        ? item.limitations
        : [],

      requires_human_review:
        item?.requires_human_review !== false,
    };
  }

  async function runEvidenceAnalysis() {
    const validClaims = claims
      .map((claim) => ({
        claim_text: getClaimText(claim),
        sources: getSources(claim),
      }))
      .filter(
        (claim) => claim.claim_text.length > 0
      )
      .slice(0, 5);

    if (validClaims.length === 0) {
      setError(
        "No extracted claims are available for evidence analysis."
      );
      return;
    }

    if (
      validClaims.some(
        (claim) => claim.claim_text.length > 2000
      )
    ) {
      setError(
        "Each claim must be 2,000 characters or fewer."
      );
      return;
    }

    const hasInvalidUrl = validClaims.some(
      (claim) =>
        claim.sources.some(
          (source) => !isValidHttpUrl(source.url)
        )
    );

    if (hasInvalidUrl) {
      setError(
        "A research source has a missing or invalid HTTP/HTTPS URL. Please review the Research Agent results."
      );
      return;
    }

    setLoading(true);
    setError("");
    setEvidence(null);

    try {
      const payload = {
        claims: validClaims,
      };

      // Debug: inspect the exact claims and sources sent.
      console.log(
        "Evidence Agent request payload:",
        payload
      );

      const response = await fetch(
        `${API_URL}/api/evidence/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const rawText = await response.text();
      let data;

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      // Debug: inspect the response from the live API.
      console.log(
        "Evidence Agent API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Evidence analysis failed."
        );
      }

      const evidenceData = data?.evidence_analysis;

      if (
        !evidenceData ||
        typeof evidenceData !== "object"
      ) {
        throw new Error(
          "Invalid evidence analysis response from server."
        );
      }

      const normalizedResults = Array.isArray(
        evidenceData.results
      )
        ? evidenceData.results.map(
            (item, index) =>
              normalizeEvidenceResult(
                item,
                index,
                validClaims
              )
          )
        : [];

      // Debug: check the final values used by the UI.
      console.log(
        "Normalized Evidence Results:",
        normalizedResults
      );

      normalizedResults.forEach((item, index) => {
        console.log(`Claim ${index + 1}:`, item.claim_text);
        console.log(
          "Classification:",
          item.classification_status
        );
        console.log(
          "Mapped:",
          item.evidence.length
        );
        console.log(
          "Supporting:",
          item.supporting_evidence.length
        );
        console.log(
          "Contradicting:",
          item.contradicting_evidence.length
        );
        console.log(
          "Contextual:",
          item.contextual_evidence.length
        );
      });

      const normalizedEvidence = {
        ...evidenceData,

        summary:
          typeof evidenceData.summary === "string"
            ? evidenceData.summary
            : "",

        results: normalizedResults,

        limitations: Array.isArray(
          evidenceData.limitations
        )
          ? evidenceData.limitations
          : [],
      };

      setEvidence(normalizedEvidence);
      onResults?.(normalizedEvidence);
    } catch (err) {
      console.error(
        "Evidence Agent error:",
        err
      );

      setError(
        err?.message ||
          "Unable to connect to the Evidence Agent."
      );
    } finally {
      setLoading(false);
    }
  }

  const results = Array.isArray(evidence?.results)
    ? evidence.results
    : [];

  const limitations = Array.isArray(
    evidence?.limitations
  )
    ? evidence.limitations
    : [];

  const validClaimCount = claims.filter(
    (claim) => getClaimText(claim).length > 0
  ).length;

  const displayClaimCount = Math.min(
    validClaimCount,
    5
  );

  return (
    <section
      className={`evidence-agent-panel ${
        theme === "light" ? "light-mode" : ""
      }`}
    >
      <div className="evidence-agent-heading">
        <div className="evidence-agent-icon">
          <BrainCircuit size={22} />
        </div>

        <div>
          <h2>Evidence Agent</h2>
          <p>
            Map available sources to claims and identify
            relevant excerpts, missing information, and
            limitations.
          </p>
        </div>
      </div>

      <div className="evidence-agent-info">
        <FileSearch size={18} />
        <p>
          Evidence analysis uses available research
          sources. Retrieved sources are leads and may
          require independent review.
        </p>
      </div>

      <div className="evidence-agent-actions">
        <span>
          {displayClaimCount} claims · Up to 5 per request
        </span>

        <button
          type="button"
          className="evidence-agent-button"
          onClick={runEvidenceAnalysis}
          disabled={
            loading || displayClaimCount === 0
          }
        >
          {loading ? (
            <>
              <LoaderCircle
                size={17}
                className="evidence-spinner"
              />
              Analyzing evidence...
            </>
          ) : (
            <>
              <Search size={17} />
              Analyze Evidence
            </>
          )}
        </button>
      </div>

      {error && (
        <p
          className="evidence-agent-error"
          role="alert"
        >
          <AlertTriangle size={17} />
          {error}
        </p>
      )}

      {loading && (
        <div className="evidence-loading">
          <LoaderCircle
            size={24}
            className="evidence-spinner"
          />
          <p>Mapping sources to claims...</p>
        </div>
      )}

      {evidence && !loading && (
        <div className="evidence-agent-results">
          <div className="evidence-summary">
            <h3>
              <FileSearch size={18} />
              Evidence Analysis Summary
            </h3>

            <p>
              {evidence.summary ||
                "No summary was provided by the analysis service."}
            </p>
          </div>

          {results.length > 0 ? (
            results.map((item, index) => {
              const mappedEvidence = item.evidence || [];
              const supporting =
                item.supporting_evidence || [];
              const contradicting =
                item.contradicting_evidence || [];
              const contextual =
                item.contextual_evidence || [];
              const missing =
                item.missing_evidence || [];
              const claimLimitations =
                item.limitations || [];

              const classificationStatus =
                item.classification_status ||
                "unavailable";

              const classificationUnavailable =
                classificationStatus === "unavailable";

              const noSources =
                classificationStatus === "no_sources";

              const classificationIncomplete =
                classificationStatus === "incomplete";

              const classificationMessage =
                noSources
                  ? "No research sources were available for classification."
                  : classificationUnavailable
                  ? "AI evidence classification is currently unavailable. Supporting and contradicting evidence could not be determined."
                  : classificationIncomplete
                  ? "Evidence classification is incomplete. Some excerpts may require manual review."
                  : null;

              return (
                <article
                  className="evidence-claim-card"
                  key={`${item.claim_text || "claim"}-${index}`}
                >
                  <h3>Claim {index + 1}</h3>

                  <p className="evidence-claim-text">
                    {item.claim_text ||
                      "Claim text unavailable."}
                  </p>

                  <div className="evidence-assessment">
                    <strong>Evidence Status</strong>
                    <p>
                      {String(
                        item.assessment ||
                          item.evidence_status ||
                          "requires_review"
                      ).replaceAll("_", " ")}
                    </p>
                  </div>

                  {classificationMessage && (
                    <div
                      className="evidence-classification-notice"
                      role="status"
                    >
                      <strong>
                        <AlertTriangle size={16} />
                        Classification Notice
                      </strong>

                      <p>{classificationMessage}</p>

                      {item.classification_reason && (
                        <small>
                          Reason:{" "}
                          {item.classification_reason}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="evidence-assessment">
                    <strong>Evidence Summary</strong>
                    <p>
                      {item.evidence_summary ||
                        "No evidence summary was provided."}
                    </p>
                  </div>

                  <EvidenceSection
                    title="Mapped Source Excerpts"
                    icon={<BookOpen size={16} />}
                    items={mappedEvidence}
                    emptyText="No source excerpts were mapped for this claim."
                  />

                  <EvidenceSection
                    title="Supporting Evidence"
                    icon={<CheckCircle2 size={16} />}
                    items={supporting}
                    emptyText={
                      classificationUnavailable ||
                      noSources
                        ? "Supporting evidence could not be determined."
                        : classificationIncomplete
                        ? "No supporting evidence was confirmed. Some evidence may still need review."
                        : "No supporting evidence was identified in the analyzed sources."
                    }
                  />

                  <EvidenceSection
                    title="Contradicting Evidence"
                    icon={<ShieldAlert size={16} />}
                    items={contradicting}
                    emptyText={
                      classificationUnavailable ||
                      noSources
                        ? "Contradicting evidence could not be determined."
                        : classificationIncomplete
                        ? "No contradicting evidence was confirmed. Some evidence may still need review."
                        : "No contradicting evidence was identified in the analyzed sources."
                    }
                  />

                  <EvidenceSection
                    title="Contextual Evidence"
                    icon={<BookOpen size={16} />}
                    items={contextual}
                    emptyText="No contextual evidence was classified."
                  />

                  <div className="evidence-subsection">
                    <h4>
                      <AlertTriangle size={16} />
                      Missing Evidence
                    </h4>

                    {missing.length > 0 ? (
                      <ul>
                        {missing.map((entry, i) => (
                          <li key={i}>
                            {typeof entry === "string"
                              ? entry
                              : entry?.description ||
                                JSON.stringify(entry)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        No missing evidence was listed.
                      </p>
                    )}
                  </div>

                  {claimLimitations.length > 0 && (
                    <div className="evidence-subsection">
                      <h4>
                        <AlertTriangle size={16} />
                        Claim Limitations
                      </h4>

                      <ul>
                        {claimLimitations.map(
                          (entry, i) => (
                            <li key={i}>
                              {typeof entry === "string"
                                ? entry
                                : entry?.description ||
                                  JSON.stringify(entry)}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {item.requires_human_review && (
                    <p className="evidence-agent-note">
                      Human review is recommended before
                      relying on this evidence assessment.
                    </p>
                  )}
                </article>
              );
            })
          ) : (
            <p>
              No per-claim evidence results were returned.
            </p>
          )}

          <div className="evidence-limitations">
            <strong>Overall Limitations</strong>

            {limitations.length > 0 ? (
              <ul>
                {limitations.map((item, index) => (
                  <li key={index}>
                    {typeof item === "string"
                      ? item
                      : item?.description ||
                        JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No overall limitations were returned.
              </p>
            )}
          </div>

          <p className="evidence-agent-note">
            Evidence mapping is preliminary. It does not
            independently verify a claim or establish
            fraud, accuracy, or intent. Human review is
            recommended.
          </p>
        </div>
      )}
    </section>
  );
}

function EvidenceSection({
  title,
  icon,
  items = [],
  emptyText,
}) {
  return (
    <div className="evidence-subsection">
      <h4>
        {icon}
        {title}
        <span className="evidence-count">
          {items.length}
        </span>
      </h4>

      {items.length > 0 ? (
        items.map((source, index) => (
          <EvidenceSource
            key={`${title}-${index}`}
            source={source}
          />
        ))
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

function EvidenceSource({ source }) {
  if (typeof source === "string") {
    return (
      <article className="evidence-source">
        <p>{source}</p>
      </article>
    );
  }

  if (!source || typeof source !== "object") {
    return null;
  }

  const title =
    source.title ||
    source.source_title ||
    "Evidence source";

  const url = source.url || source.source_url;

  const excerpt =
    source.excerpt ||
    source.evidence_excerpt ||
    source.evidence ||
    source.description ||
    source.reason;

  const safeUrl = (() => {
    try {
      const parsed = new URL(url);

      return ["http:", "https:"].includes(
        parsed.protocol
      )
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  })();

  return (
    <article className="evidence-source">
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
          <ExternalLink size={14} />
        </a>
      ) : (
        <strong>{title}</strong>
      )}

      {excerpt && <p>{excerpt}</p>}

      {source.relevance && (
        <small>
          Relevance:{" "}
          {String(source.relevance).replaceAll(
            "_",
            " "
          )}
        </small>
      )}

      {Array.isArray(source.matching_terms) &&
        source.matching_terms.length > 0 && (
          <small>
            Matching terms:{" "}
            {source.matching_terms.join(", ")}
          </small>
        )}

      {source.explanation && (
        <p>{source.explanation}</p>
      )}
    </article>
  );
}
