import { useCallback, useEffect, useState, type ReactNode } from "react";

interface ChartItem {
  label: string;
  count: number;
  pct: number;
}

interface ChartData {
  type: "bar";
  title: string;
  dimension?: string;
  year?: string | null;
  total: number;
  scope: string;
  items: ChartItem[];
  item_noun?: string;
  dataset?: string;
  dataset_url?: string;
  note?: string;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  sources?: string;
  chart?: ChartData | null;
  timings?: {
    retrieval_seconds?: number | null;
    generation_seconds?: number | null;
    total_seconds?: number | null;
    server_seconds?: number | null;
  };
}

interface HealthResponse {
  status: string;
  model?: string;
  vector_chunks?: number;
  cve_records?: number;
  ransomware_claims?: number;
  phish_domains?: number;
  live_api_configured?: boolean;
}

type ActiveTab = "cti" | "email";

const CTI_SAMPLE_PROMPTS = [
  {
    label: "Healthcare Ransomware Cases",
    prompt:
      "Give two documented healthcare ransomware cases and explain their impact and documented response.",
  },
  {
    label: "MiniDuke PDF Zero-Day",
    prompt:
      "What is the MiniDuke PDF zero-day attack? Explain how it works, give a similar real-world case example, and list step-by-step mitigations.",
  },
  {
    label: "Wiper Malware Overview",
    prompt:
      "Explain what a wiper attack is in simple terms, provide a real case study example, and give step-by-step defensive mitigations.",
  },
  {
    label: "2026 Sector Targets (Stats)",
    prompt:
      "In 2026, which sectors were targeted most in ransomware leak-site claims? Show the percentage breakdown.",
  },
  {
    label: "Attack Types 2026 (Stats)",
    prompt:
      "What types of malware or cyberattacks were utilised most in 2026? Show the percentage breakdown.",
  },
];

const CTI_FOLLOWUP_SUGGESTIONS = [
  "Give a similar real-world case study and explain what happened step by step.",
  "Provide step-by-step mitigation and incident response actions with dataset citations.",
  "What specific CVEs, malware tools, or IOCs are documented for this threat?",
];

const EMAIL_TRIAGE_SAMPLES = [
  {
    label: "Sample 1: M365 Password Expiry Phish",
    badge: "High Risk",
    content: `From: "Microsoft 365 Security Team" <security-alert@m365-auth-verify-portal.com>
Reply-To: support-desk@secure-login-update.net
To: analyst@enterprise-corp.org
Subject: URGENT: Your Office 365 Password Expires in 2 Hours - Action Required

Dear Employee,

Our automated security system detected that your corporate Microsoft 365 credentials are scheduled to expire today at 17:00 UTC. To avoid immediate suspension of your Outlook and Teams access, verify your account immediately using the secure portal below:

https://m365-auth-verify-portal.com/owa/session-renew?user=analyst

Failure to validate within 2 hours will result in permanent mailbox lockout.

IT Helpdesk Administration`,
  },
  {
    label: "Sample 2: Urgent Wire Transfer / BEC",
    badge: "BEC Fraud",
    content: `From: "David Chen (CEO)" <d.chen.executive@gmail.com>
To: finance-payable@enterprise-corp.org
Subject: Confidential - Urgent Vendor Wire Settlement Today

Hi,

I am currently in an off-site board meeting and cannot take calls. We need to finalize an urgent acquisition retainer before 3:00 PM today. Please process an immediate wire transfer of $48,500 USD to the updated escrow account below and send me the confirmation receipt as soon as it is queued.

Beneficiary: Apex Global Holdings Ltd
Account: 8849201944
Routing: 021000021
Reference: INV-2026-Q4-CONF

Keep this strictly confidential until the announcement goes out.

Sent from my iPhone`,
  },
  {
    label: "Sample 3: Routine Security Bulletin",
    badge: "Low Risk / Benign",
    content: `From: "Enterprise SOC Awareness" <soc-updates@enterprise-corp.org>
To: all-staff@enterprise-corp.org
Subject: Monthly Patch Tuesday Reminder & Phishing Reporting Guide

Hello Team,

As part of our scheduled monthly maintenance window this Thursday from 22:00 to 00:00, workstations will automatically install approved OS security updates. Please save your work before logging off.

If you ever receive a suspicious email asking for passwords or urgent wire transfers, use the "Report Phish" button in Outlook rather than clicking any links.

Thank you,
Information Security Operations`,
  },
];

const KNOWLEDGE_COVERAGE = [
  "Historical CTI reports (archive)",
  "ThreatCluster incident summaries",
  "CVE exploitation signals (CVSS, KEV)",
  "Ransomware leak-site claims",
  "Curated CTI Q&A",
  "PhishDestroy domain blocklist",
  "Optional live ThreatCluster API",
  "NVD live CVE fallback (NIST)",
];

const CITATION_LEGEND = [
  { tag: "[S#]", desc: "Historical CTI Reports & Curated Q&A" },
  { tag: "[C#]", desc: "ThreatCluster Incident Case Summaries" },
  { tag: "[V#]", desc: "CVE / CISA KEV Vulnerability Records" },
  { tag: "[R#]", desc: "Ransomware Leak-Site Claims Dataset" },
  { tag: "[L#]", desc: "Live ThreatCluster API Intelligence" },
  { tag: "[N#]", desc: "Live NVD CVE Record" },
  { tag: "[AGG#]", desc: "Derived Dataset Statistic" },
];

function renderInlineFormatting(text: string): ReactNode[] {
  // Split bold (**text**) and citation tags ([S1], [C2], [V1], [R1], [L1], [N1], [AGG1], [IOC1])
  const tokens = text.split(/(\*\*[^*]+\*\*|\[(?:(?:S|C|V|R|L|N|AGG|IOC)\d+)\])/g);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (/^\[(?:(?:S|C|V|R|L|N|AGG|IOC)\d+)\]$/.test(token)) {
      return (
        <span key={index} className="cite-badge" title="Grounded Dataset Citation">
          {token}
        </span>
      );
    }
    return token;
  });
}

function StructuredMarkdown({ content }: { content: string }) {
  const lines = (content || "").split("\n");
  const elements: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: ReactNode[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!listBuffer) return;
    if (listBuffer.ordered) {
      elements.push(
        <ol key={`${keyPrefix}-ol`} className="md-ol">
          {listBuffer.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`${keyPrefix}-ul`} className="md-ul">
          {listBuffer.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    listBuffer = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(`empty-${idx}`);
      return;
    }

    if (line === "---") {
      flushList(`hr-${idx}`);
      elements.push(<hr key={`hr-${idx}`} className="md-hr" />);
      return;
    }

    if (line.startsWith("### ")) {
      flushList(`h3-${idx}`);
      elements.push(
        <h4 key={`h3-${idx}`} className="md-h4">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList(`h2-${idx}`);
      elements.push(
        <h3 key={`h2-${idx}`} className="md-h3">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
      return;
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList(`sw-ol-${idx}`);
        listBuffer = { ordered: true, items: [] };
      }
      listBuffer.items.push(renderInlineFormatting(orderedMatch[2]));
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!listBuffer || listBuffer.ordered) {
        flushList(`sw-ul-${idx}`);
        listBuffer = { ordered: false, items: [] };
      }
      listBuffer.items.push(renderInlineFormatting(line.slice(2)));
      return;
    }

    flushList(`p-${idx}`);
    elements.push(
      <p key={`p-${idx}`} className="md-p">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushList("end");
  return <div className="md-root">{elements}</div>;
}

function BarChartView({ data }: { data: ChartData }) {
  const maxPct = Math.max(...data.items.map((item) => item.pct), 1);
  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">{data.title}</span>
        <span className="chart-scope">
          {data.scope.replace(/`/g, "")}
        </span>
      </div>
      <div className="chart-rows">
        {data.items.map((item, idx) => (
          <div className="chart-row" key={idx}>
            <span className="chart-label" title={item.label}>
              {item.label}
            </span>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{ width: `${(item.pct / maxPct) * 100}%` }}
              />
            </div>
            <span className="chart-value">
              {item.count.toLocaleString()} · {item.pct}%
            </span>
          </div>
        ))}
      </div>
      {(data.note || data.dataset_url) && (
        <div className="chart-footer">
          {data.note && <p className="chart-note">{data.note}</p>}
          {data.dataset_url && (
            <a
              className="chart-dataset-link"
              href={data.dataset_url}
              target="_blank"
              rel="noreferrer"
            >
              Source dataset: {data.dataset}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit,
  retries = 0,
  timeoutMs = 15000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      return response;
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Network request failed.");
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("cti-theme") === "dark" ? "dark" : "light"
  );

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(true);
  const [connectionFeedback, setConnectionFeedback] = useState<{
    type: "idle" | "error" | "success";
    message: string;
  }>({ type: "idle", message: "Checking the secure Vercel API connection..." });
  const [healthStats, setHealthStats] = useState<HealthResponse | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("cti");
  const [useLiveApi, setUseLiveApi] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // CTI Research & Multi-Turn Follow-up State
  const [ctiInput, setCtiInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [activeSources, setActiveSources] = useState<string>("");

  // Email Triage State
  const [emailInput, setEmailInput] = useState<string>("");
  const [emailAssessment, setEmailAssessment] = useState<string>("");
  const [emailSources, setEmailSources] = useState<string>("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cti-theme", theme);
  }, [theme]);

  // The browser talks only to the same-origin Vercel API. Gateway credentials
  // remain in Vercel environment variables and are never exposed to this app.
  const checkBackendHealth = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const res = await fetchWithTimeoutAndRetry(
        "/api/cti/health",
        { method: "GET", headers: { Accept: "application/json" } },
        0,
        12000
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Vercel API returned HTTP ${res.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
      }

      const data: HealthResponse = await res.json();
      if (data.status !== "ok") {
        throw new Error("The backend responded, but its health status is not OK.");
      }

      setIsOnline(true);
      setHealthStats(data);
      setConnectionFeedback({
        type: "success",
        message: `Connected through Vercel · ${data.model || "Gemma 2 2B"} · ${data.vector_chunks ?? 0} vector chunks indexed.`,
      });
    } catch (error) {
      setIsOnline(false);
      setHealthStats(null);
      setConnectionFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach the backend through the Vercel API proxy. Check that Colab is running.",
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  useEffect(() => {
    void checkBackendHealth();
  }, [checkBackendHealth]);

  // Send the analyst's original question without a forced four-section template.
  // The backend chooses a concise answer style based on what the analyst actually asks.
  const buildStructuredQueryPayload = (userQuestion: string): string => userQuestion.trim();

  const submitCtiQuestion = async (overrideQuestion?: string) => {
    const rawQuestion = (overrideQuestion ?? ctiInput).trim();
    if (!rawQuestion || isAnalyzing) return;

    const userTurn: ChatTurn = { role: "user", content: rawQuestion };
    const nextHistory = [...chatHistory, userTurn];
    setChatHistory(nextHistory);
    setCtiInput("");
    setIsAnalyzing(true);

    try {
      const res = await fetchWithTimeoutAndRetry(
        "/api/cti/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            question: buildStructuredQueryPayload(rawQuestion),
            mode: "cti",
            use_live_api: useLiveApi,
            history: chatHistory.slice(-6).map((turn) => ({
              role: turn.role,
              content: turn.content,
            })),
          }),
        },
        0,
        58000
      );

      if (res.status === 401) {
        throw new Error("Gateway authentication failed (401). Check the CTI_GATEWAY_KEY configured in Vercel and the matching Cloud Run secret.");
      }
      if (!res.ok) {
        throw new Error(`Backend returned HTTP ${res.status}.`);
      }

      const data = await res.json();
      const assistantTurn: ChatTurn = {
        role: "assistant",
        content: data.answer_markdown || "No response returned.",
        sources: data.sources_markdown || "",
        chart: (data.chart as ChartData | null) ?? null,
        timings: data.timings,
      };

      setChatHistory([...nextHistory, assistantTurn]);
      setActiveSources(data.sources_markdown || "");
      setIsOnline(true);
    } catch (err: unknown) {
      setIsOnline(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Could not reach the backend through the Vercel API proxy. Check that Colab is running.";
      setChatHistory([
        ...nextHistory,
        {
          role: "assistant",
          content: `**Connection / Query Error:** ${msg}`,
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitEmailTriage = async () => {
    const rawEmail = emailInput.trim();
    if (!rawEmail || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const res = await fetchWithTimeoutAndRetry(
        "/api/cti/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            question: rawEmail,
            mode: "email",
            use_live_api: useLiveApi,
            history: [],
          }),
        },
        0,
        58000
      );

      if (res.status === 401) {
        throw new Error("Gateway authentication failed (401). Check the Vercel and Cloud Run gateway-key configuration.");
      }
      if (!res.ok) {
        throw new Error(`Backend returned HTTP ${res.status}.`);
      }

      const data = await res.json();
      setEmailAssessment(data.answer_markdown || "No triage result returned.");
      setEmailSources(data.sources_markdown || "");
      setActiveSources(data.sources_markdown || "");
      setIsOnline(true);
    } catch (err: unknown) {
      setIsOnline(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Could not reach the backend through the Vercel API proxy. Check that Colab is running.";
      setEmailAssessment(`**Triage Error:** ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentSidebarSources =
    activeTab === "email" ? emailSources || activeSources : activeSources;

  return (
    <div className="page-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L20 5.5V11.5C20 16.8 16.58 21.68 12 23C7.42 21.68 4 16.8 4 11.5V5.5L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.2L11 14.2L15.2 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="brand-title">CTI RAG Assistant</div>
            <div className="brand-subtitle">
              Gemma 2 2B · Chroma + BM25 hybrid retrieval
            </div>
          </div>
        </div>

        <div className="navbar-actions">
          <div className={`status-pill ${isOnline ? "online" : "offline"}`}>
            <span className="status-dot" />
            <span>{isOnline ? "Backend online" : "Backend offline"}</span>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle light and dark theme"
            title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="container">
        {/* Backend connection status: credentials are handled server-side by Vercel. */}
        <section className="card connection-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 320px" }}>
              <strong>Secure backend connection</strong>
              <p className="helper-note">
                This website connects through its secure Vercel API proxy. Backend URLs and access keys are configured on the server and are not entered or stored in your browser.
              </p>
              {connectionFeedback.message && (
                <p className={`connection-feedback ${connectionFeedback.type}`}>
                  {connectionFeedback.message}
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn-primary save-test-btn"
              onClick={() => void checkBackendHealth()}
              disabled={isCheckingBackend}
            >
              {isCheckingBackend ? "Checking..." : "Check connection"}
            </button>
          </div>
        </section>

        {/* Hero Heading */}
        <section className="hero">
          <h1>Evidence-grounded threat intelligence</h1>
          <p>
            Research threat actors, CVEs and ransomware claims, or triage a suspicious email. Every answer is
            built only from retrieved dataset records and labelled live API results, with sources shown beside it.
          </p>
        </section>

        {/* Two-Column Workspace */}
        <div className="workspace-grid">
          {/* Left Column: Research & Email Triage */}
          <div className="workspace-main">
            <section className="card workspace-card">
              <div className="workspace-header">
                <div className="segmented-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "cti"}
                    className={`seg-tab ${activeTab === "cti" ? "active" : ""}`}
                    onClick={() => setActiveTab("cti")}
                  >
                    CTI research
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "email"}
                    className={`seg-tab ${activeTab === "email" ? "active" : ""}`}
                    onClick={() => setActiveTab("email")}
                  >
                    Email triage
                  </button>
                </div>

                <label className="live-api-check">
                  <input
                    type="checkbox"
                    checked={useLiveApi}
                    onChange={(e) => setUseLiveApi(e.target.checked)}
                  />
                  <span>Live ThreatCluster API (current/recent checks)</span>
                </label>
              </div>

              {activeTab === "cti" ? (
                <div className="cti-pane">
                  <p className="pane-prompt-label">
                    Ask about threat actors, malware, vulnerabilities, incidents, targets, impacts and
                    documented mitigations. Ask follow-up questions in the same thread for deeper case studies
                    and step-by-step remediation.
                  </p>

                  {/* Sample Prompts */}
                  <div className="sample-bar">
                    <span className="sample-label">Samples:</span>
                    {CTI_SAMPLE_PROMPTS.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="sample-chip"
                        onClick={() => setCtiInput(item.prompt)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Conversation History Thread */}
                  {chatHistory.length > 0 && (
                    <div className="thread-container">
                      {chatHistory.map((turn, index) => (
                        <div key={index} className={`turn-card ${turn.role}`}>
                          <div className="turn-header">
                            <span className="turn-author">
                              {turn.role === "user"
                                ? index === 0
                                  ? "Analyst Query"
                                  : "Follow-Up Question"
                                : "Evidence-Grounded CTI Analysis"}
                            </span>
                            {turn.timings?.server_seconds && (
                              <span className="turn-meta">
                                {turn.timings.server_seconds}s
                              </span>
                            )}
                          </div>

                          <div className="turn-body">
                            {turn.role === "user" ? (
                              <p className="user-question-text">{turn.content}</p>
                            ) : (
                              <>
                                <StructuredMarkdown content={turn.content} />
                                {turn.chart && <BarChartView data={turn.chart} />}
                              </>
                            )}
                          </div>

                          {turn.role === "assistant" && turn.sources && (
                            <details className="inline-sources">
                              <summary>View dataset citations &amp; retrieved evidence for this turn</summary>
                              <div className="inline-sources-body">
                                <StructuredMarkdown content={turn.sources} />
                              </div>
                            </details>
                          )}
                        </div>
                      ))}

                      {isAnalyzing && (
                        <div className="analyzing-banner">
                          Retrieving records across Chroma + BM25 and generating cited analysis...
                        </div>
                      )}

                      {/* Quick Follow-up Chips */}
                      {!isAnalyzing && (
                        <div className="followup-bar">
                          <span className="sample-label">Follow-up prompts:</span>
                          {CTI_FOLLOWUP_SUGGESTIONS.map((fq, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="sample-chip"
                              onClick={() => submitCtiQuestion(fq)}
                            >
                              {fq}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Composer */}
                  <div className="composer-box">
                    <textarea
                      rows={4}
                      placeholder={
                        chatHistory.length === 0
                          ? "e.g. Give two documented healthcare ransomware cases and explain their impact and documented response."
                          : "Ask a follow-up question (e.g. Give a similar real case study and step-by-step mitigation with citations)..."
                      }
                      value={ctiInput}
                      onChange={(e) => setCtiInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitCtiQuestion();
                        }
                      }}
                    />

                    <div className="composer-footer">
                      <span className="hint-text">
                        Press Enter to analyze · Shift+Enter for new line
                      </span>
                      <div className="composer-buttons">
                        {chatHistory.length > 0 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setChatHistory([]);
                              setActiveSources("");
                            }}
                          >
                            New thread
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={isAnalyzing || !ctiInput.trim()}
                          onClick={() => submitCtiQuestion()}
                        >
                          {isAnalyzing
                            ? "Analyzing..."
                            : chatHistory.length > 0
                            ? "Ask follow-up"
                            : "Analyze threat"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Triage Tab */
                <div className="email-pane">
                  <p className="pane-prompt-label">
                    Paste a suspicious email (headers, sender, subject, body, and URLs) to inspect phishing
                    indicators, check domains against the PhishDestroy blocklist, and generate step-by-step
                    SOC triage actions.
                  </p>

                  {/* Email Triage Sample Buttons */}
                  <div className="sample-bar">
                    <span className="sample-label">Test samples:</span>
                    {EMAIL_TRIAGE_SAMPLES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="sample-chip"
                        onClick={() => {
                          setEmailInput(sample.content);
                          setEmailAssessment("");
                        }}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>

                  <div className="composer-box">
                    <textarea
                      rows={8}
                      placeholder="Paste raw email headers, sender address, subject line, and message body here..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <div className="composer-footer">
                      <span className="hint-text">
                        Domain-only privacy lookup · Raw email text is never sent to external APIs
                      </span>
                      <div className="composer-buttons">
                        {emailInput && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setEmailInput("");
                              setEmailAssessment("");
                              setEmailSources("");
                            }}
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={isAnalyzing || !emailInput.trim()}
                          onClick={submitEmailTriage}
                        >
                          {isAnalyzing ? "Triaging email..." : "Run email triage"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {emailAssessment && (
                    <div className="turn-card assistant email-result">
                      <div className="turn-header">
                        <span className="turn-author">SOC Email Triage Report</span>
                      </div>
                      <div className="turn-body">
                        <StructuredMarkdown content={emailAssessment} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Knowledge Coverage & Live Retrieved Sources */}
          <aside className="workspace-sidebar">
            <section className="card sidebar-card">
              <h2 className="sidebar-title">Knowledge coverage</h2>
              <ul className="coverage-list">
                {KNOWLEDGE_COVERAGE.map((item, idx) => (
                  <li key={idx}>
                    <span className="coverage-dot" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {healthStats && (
                <div className="indexed-stats">
                  <div>
                    <strong>{healthStats.vector_chunks ?? 0}</strong>
                    <span>Vector chunks</span>
                  </div>
                  <div>
                    <strong>{healthStats.cve_records ?? 0}</strong>
                    <span>CVE signals</span>
                  </div>
                  <div>
                    <strong>{healthStats.phish_domains ?? 0}</strong>
                    <span>Blocklist domains</span>
                  </div>
                </div>
              )}
            </section>

            {/* Dataset Citation Key */}
            <section className="card sidebar-card">
              <h2 className="sidebar-title">Dataset citation guide</h2>
              <ul className="citation-legend-list">
                {CITATION_LEGEND.map((c, idx) => (
                  <li key={idx}>
                    <span className="cite-badge">{c.tag}</span>
                    <span>{c.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Live Retrieved Sources Panel ("with sources shown beside it") */}
            {currentSidebarSources && (
              <section className="card sidebar-card sources-sidebar-card">
                <h2 className="sidebar-title">Retrieved sources &amp; citations</h2>
                <div className="sidebar-sources-scroll">
                  <StructuredMarkdown content={currentSidebarSources} />
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}