
import { useState } from "react";
import {
  Search,
  ExternalLink,
  LoaderCircle,
  BookOpenCheck,
} from "lucide-react";

import "./ResearchAgent.css";

const API_URL = "http://127.0.0.1:8000";

export default function ResearchAgent({
  claims = [],
  onResults,
}) {
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Convert extracted claims into plain text
  function getClaimText(item) {
    if (typeof item === "string") {
      return item.trim();
    }

    if (typeof item?.claim_text === "string") {
      return item.claim_text.trim();
    }

    if (typeof item?.text === "string") {
      return item.text.trim();
    }

    return "";
  }

  // Search for sources related to extracted claims
  async function runResearch() {
    const claimTexts = claims
      .map(getClaimText)
      .filter((text) => text.length > 0)
      .slice(0, 5);

    if (claimTexts.length === 0) {
      setError("No extracted claims are available to research.");
      setResearch(null);
      return;
    }

    setLoading(true);
    setError("");
    setResearch(null);

    try {
      const response = await fetch(
        `${API_URL}/api/research/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            claims: claimTexts,
          }),
        }
      );

      // Safely read the server response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Research failed. Please try again."
        );
      }

      // Expected response:
      // { "research": { "results": [], "limitations": [] } }
      const researchData = data?.research;

      if (!researchData || !Array.isArray(researchData.results)) {
        throw new Error(
          "Invalid research response. Please check the backend API."
        );
      }

      // Normalize each result so the UI can safely display it
      const results = researchData.results.map((item, index) => ({
        claim_text:
          typeof item?.claim_text === "string"
            ? item.claim_text
            : claimTexts[index] || "Claim text unavailable.",

        search_query:
          typeof item?.search_query === "string"
            ? item.search_query
            : "",

        status:
          typeof item?.status === "string"
            ? item.status
            : "completed",

        message:
          typeof item?.message === "string"
            ? item.message
            : "",

        sources: Array.isArray(item?.sources)
          ? item.sources.filter(
              (source) =>
                source && typeof source === "object"
            )
          : [],
      }));

      const normalizedResearch = {
        ...researchData,
        results,
        limitations: Array.isArray(researchData.limitations)
          ? researchData.limitations
          : [],
      };

      setResearch(normalizedResearch);

      // Send the same results to App.jsx
      // so Evidence Analysis can use the research sources
      onResults?.(results);
    } catch (err) {
      setError(
        err?.message || "Unable to retrieve research sources."
      );
      onResults?.([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="research-agent-panel">
      <div className="research-agent-heading">
        <div className="research-agent-icon">
          <BookOpenCheck size={21} />
        </div>

        <div>
          <h2>Research Agent</h2>
          <p>
            Find relevant sources for extracted claims.
          </p>
        </div>
      </div>

      <button
        className="research-agent-button"
        onClick={runResearch}
        disabled={loading || claims.length === 0}
        type="button"
      >
        {loading ? (
          <LoaderCircle
            className="research-spin"
            size={17}
          />
        ) : (
          <Search size={17} />
        )}

        {loading
          ? "Searching sources..."
          : "Research extracted claims"}
      </button>

      {error && (
        <p className="research-error" role="alert">
          {error}
        </p>
      )}

      {research && (
        <div className="research-results">
          {research.results.length > 0 ? (
            research.results.map((item, i) => (
              <div
                className="research-claim"
                key={`${item.claim_text}-${i}`}
              >
                <h3>Claim {i + 1}</h3>

                <p className="research-claim-text">
                  {item.claim_text}
                </p>

                {item.search_query && (
                  <small>
                    Search query: {item.search_query}
                  </small>
                )}

                {item.status !== "completed" && (
                  <p>
                    {item.message || "Research was not completed."}
                  </p>
                )}

                {item.sources.length > 0 ? (
                  item.sources.map((source, j) => (
                    <article
                      className="research-source"
                      key={`${source.url || source.title || "source"}-${j}`}
                    >
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title || "Open source"}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <strong>
                          {source.title || "Source"}
                        </strong>
                      )}

                      <p>
                        {source.excerpt ||
                          "No excerpt available."}
                      </p>

                      <small>
                        {source.published_date ||
                          "Publication date not provided"}
                        {" · Retrieved "}
                        {source.retrieved_at
                          ? new Date(
                              source.retrieved_at
                            ).toLocaleString()
                          : "date unavailable"}
                      </small>
                    </article>
                  ))
                ) : (
                  <p>No sources were found for this claim.</p>
                )}
              </div>
            ))
          ) : (
            <p>No research results were returned.</p>
          )}

          {research.limitations.length > 0 && (
            <div className="research-limitations">
              <strong>Research limitations</strong>
              <ul>
                {research.limitations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="research-note">
            Retrieved sources are research leads. They are
            not independently verified evidence or a verdict.
          </p>
        </div>
      )}
    </section>
  );
}
