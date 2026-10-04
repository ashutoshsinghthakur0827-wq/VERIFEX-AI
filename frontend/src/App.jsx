
import { useState } from "react";
import {
  BrainCircuit,
  FileText,
  Search,
  ShieldCheck,
  ClipboardCheck,
  Moon,
  Sun,
  RotateCcw,
  Menu,
  X,
  FileChartColumn,
} from "lucide-react";

import Intake from "./Intake";
import ClaimAnalysis from "./ClaimAnalysis";
import ResearchAgent from "./ResearchAgent";
import EvidenceAnalysis from "./EvidenceAnalysis";
import VerificationAgent from "./VerificationAgent";
import ReportAgent from "./ReportAgent";

import "./App.css";

const navigation = [
  { id: "intake", label: "Input", icon: FileText, step: "01" },
  { id: "claims", label: "Claims", icon: BrainCircuit, step: "02" },
  { id: "research", label: "Research", icon: Search, step: "03" },
  { id: "evidence", label: "Evidence", icon: ClipboardCheck, step: "04" },
  { id: "verification", label: "Verify", icon: ShieldCheck, step: "05" },
  { id: "report", label: "Report", icon: FileChartColumn, step: "06" },
];

export default function App() {
  const [activePage, setActivePage] = useState("intake");
  const [theme, setTheme] = useState("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [content, setContent] = useState("");
  const [claims, setClaims] = useState([]);
  const [researchResults, setResearchResults] = useState([]);
  const [evidenceResults, setEvidenceResults] = useState(null);
  const [verificationResults, setVerificationResults] = useState(null);
  const [reportData, setReportData] = useState(null);

  function handleContentReady(newContent) {
    setContent(newContent || "");
    setClaims([]);
    setResearchResults([]);
    setEvidenceResults(null);
    setVerificationResults(null);
    setReportData(null);
    setActivePage("claims");
    setMobileMenuOpen(false);
  }

  function handleClaims(newClaims) {
    setClaims(Array.isArray(newClaims) ? newClaims : []);
    setResearchResults([]);
    setEvidenceResults(null);
    setVerificationResults(null);
    setReportData(null);
  }

  function handleResearchResults(results) {
    setResearchResults(Array.isArray(results) ? results : []);
    setEvidenceResults(null);
    setVerificationResults(null);
    setReportData(null);
  }

  function handleEvidenceResults(results) {
    setEvidenceResults(results || null);
    setVerificationResults(null);
    setReportData(null);
  }

  function handleVerificationResults(results) {
    setVerificationResults(results || null);
    setReportData(null);
  }

  function handleReportData(results) {
    setReportData(results || null);
  }

  function resetProject() {
    setContent("");
    setClaims([]);
    setResearchResults([]);
    setEvidenceResults(null);
    setVerificationResults(null);
    setReportData(null);
    setActivePage("intake");
    setMobileMenuOpen(false);
  }

  function navigateTo(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
  }

  const currentSection = navigation.find(
    (item) => item.id === activePage
  );

  const pageRequirements = {
    research: {
      ready: claims.length > 0,
      title: "Research is waiting for extracted claims",
      message:
        "Submit your content and complete Claim Analysis first. The Research Agent needs individual claims to search for relevant sources.",
      action: "Go to Claim Analysis",
      target: "claims",
    },
    evidence: {
      ready: claims.length > 0,
      title: "Evidence Analysis is waiting for claims",
      message:
        "Extract claims first, then run research to gather source material for evidence assessment.",
      action: "Go to Research",
      target: "research",
    },
    verification: {
      ready: Boolean(evidenceResults),
      title: "Verification is waiting for evidence",
      message:
        "Complete Evidence Analysis first. The Verification Agent uses the evidence assessment to prepare its findings.",
      action: "Go to Evidence",
      target: "evidence",
    },
    report: {
      ready: Boolean(verificationResults),
      title: "Your report is not ready yet",
      message:
        "Complete the verification step first. The Report Agent uses the findings to prepare your final report.",
      action: "Go to Verify",
      target: "verification",
    },
  };

  const requirement = pageRequirements[activePage];
  const showPage = !requirement || requirement.ready;

  function renderPage() {
    if (requirement && !requirement.ready) {
      return (
        <div className="page-requirement">
          <div className="requirement-icon">
            <ShieldCheck size={30} />
          </div>
          <h2>{requirement.title}</h2>
          <p>{requirement.message}</p>
          <button
            type="button"
            className="requirement-button"
            onClick={() => navigateTo(requirement.target)}
          >
            {requirement.action}
          </button>
        </div>
      );
    }

    switch (activePage) {
      case "intake":
        return (
          <Intake onContentReady={handleContentReady} />
        );

      case "claims":
        return (
          <ClaimAnalysis
            content={content}
            setContent={setContent}
            onClaimsExtracted={handleClaims}
            onResearchResults={handleResearchResults}
          />
        );

      case "research":
        return (
          <ResearchAgent
            claims={claims}
            onResults={handleResearchResults}
          />
        );

      case "evidence":
        return (
          <EvidenceAnalysis
            claims={claims}
            researchResults={researchResults}
            theme={theme}
            onResults={handleEvidenceResults}
          />
        );

      case "verification":
        return (
          <VerificationAgent
            claims={claims}
            evidenceResults={evidenceResults}
            theme={theme}
            onResults={handleVerificationResults}
          />
        );

      case "report":
        return (
          <ReportAgent
            claims={claims}
            researchResults={researchResults}
            evidenceResults={evidenceResults}
            verificationResults={verificationResults}
            reportData={reportData}
            theme={theme}
            onResults={handleReportData}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className={`app-container ${theme}-theme`}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left sidebar */}
      <aside
        className={`app-sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="app-logo">
            <BrainCircuit size={25} />
          </div>
          <div className="sidebar-brand-text">
            <h1>Verifex AI</h1>
            <p>AI Verification Platform</p>
          </div>
          <button
            type="button"
            className="mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <nav className="app-navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="nav-icon">
                  <Icon size={19} />
                </span>
                <span className="nav-label">
                  {item.label}
                </span>
                <span className="nav-step">
                  {item.step}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" />
          <span>Workspace ready</span>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-brand">
            <ShieldCheck size={17} />
            <span>Verifex AI</span>
          </div>
          <small>Evidence-led claim research</small>
        </div>
      </aside>

      {/* Right content area */}
      <div className="app-workspace">
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="header-page-title">
              <span>VERIFEX AI / WORKSPACE</span>
              <h2>{currentSection?.label || "Workspace"}</h2>
            </div>
          </div>

          <div className="app-header-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() =>
                setTheme((current) =>
                  current === "dark" ? "light" : "dark"
                )
              }
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
              <span>
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>

            <button
              type="button"
              className="reset-button"
              onClick={resetProject}
              title="Start a new analysis"
            >
              <RotateCcw size={17} />
              <span>New Analysis</span>
            </button>
          </div>
        </header>

        <main className="app-main">
          <div className="page-content">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}