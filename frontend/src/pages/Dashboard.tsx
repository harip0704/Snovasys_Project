import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import "./Dashboard.css";

type DocumentItem = {
  id: string;
  name: string;
  updated: string;
  status: string;
};

type DocumentsResponse = {
  count: number;
  documents: {
    id: number;
    fileName: string;
    uploadedAt: string;
    status: string;
  }[];
};

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: "▦" },
  { label: "My Documents", path: "/documents", icon: "▤" },
  { label: "Shared Documents", path: "/shared-documents", icon: "⇄" },
  { label: "Permissions", path: "/permissions", icon: "♙" },
  { label: "Audit Logs", path: "/audit-log", icon: "◷" },
  { label: "Team", path: "/team", icon: "♧" },
  { label: "Settings", path: "/settings", icon: "⚙" },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("trustvault-theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      setDocumentsLoading(true);
      setDocumentsError("");

      try {
        const response = await apiRequest<DocumentsResponse>(
          "/api/documents"
        );

        if (!active) return;

        const actualDocuments: DocumentItem[] = response.documents.map(
          (document) => ({
            id: String(document.id),
            name: document.fileName,
            updated: new Date(document.uploadedAt).toLocaleString(),
            status: document.status,
          })
        );

        setDocuments(actualDocuments);
      } catch (error) {
        if (!active) return;

        setDocumentsError(
          error instanceof Error
            ? error.message
            : "Unable to load documents."
        );
      } finally {
        if (active) setDocumentsLoading(false);
      }
    }

    void loadDocuments();

    return () => {
      active = false;
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return documents;

    return documents.filter((document) =>
      [document.name, document.id, document.status, document.updated]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [documents, search]);

  function toggleTheme() {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);

    try {
      localStorage.setItem(
        "trustvault-theme",
        nextTheme ? "dark" : "light"
      );
    } catch {
      // Theme still changes for the current page session.
    }
  }

  function handleUploadClick() {
    navigate("/documents");
  }

  return (
    <div className={`tv-app ${darkMode ? "tv-dark" : "tv-light"}`}>
      <aside className="tv-sidebar">
        <Link to="/dashboard" className="tv-brand">
          <span className="tv-brand-mark">◆</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE WORKSPACE</small>
          </span>
        </Link>

        <p className="tv-nav-label">WORKSPACE</p>

        <nav className="tv-navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`tv-nav-link ${active ? "active" : ""}`}
              >
                <span className="tv-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="tv-sidebar-security">
          <span className="tv-security-icon">♙</span>
          <h3>Security first</h3>
          <p>
            Every document should have controlled access and an accountable
            activity history.
          </p>
          <span className="tv-live-indicator">
            <i /> Backend connected through API
          </span>
        </div>

        <button
          className="tv-signout"
          type="button"
          onClick={() => navigate("/login")}
        >
          ↪ <span>Sign out</span>
        </button>
      </aside>

      <main className="tv-main">
        <header className="tv-topbar">
          <div>
            <p className="tv-breadcrumb">Workspace / Overview</p>
            <h1>Security Dashboard</h1>
          </div>

          <div className="tv-topbar-actions">
            <button
              type="button"
              className="tv-secondary-button"
              onClick={toggleTheme}
              aria-label="Toggle light and dark theme"
            >
              {darkMode ? "☀ Light Mode" : "☾ Dark Mode"}
            </button>

            <Link to="/profile" className="tv-user-profile">
              <span className="tv-user-avatar">H</span>
              <span>
                <strong>Hari</strong>
                <small>Workspace User</small>
              </span>
            </Link>
          </div>
        </header>

        <section className="tv-hero">
          <div className="tv-hero-content">
            <p className="tv-eyebrow">YOUR SECURE WORKSPACE</p>
            <h2>Documents under your control.</h2>
            <p>
              Manage files, review access, and monitor document activity
              from one place.
            </p>

            <div className="tv-hero-actions">
              <button
                type="button"
                className="tv-primary-button"
                onClick={handleUploadClick}
              >
                + Upload document
              </button>

              <Link to="/permissions" className="tv-hero-link">
                Manage access →
              </Link>
            </div>
          </div>

          <div className="tv-hero-art" aria-hidden="true">
            <div className="tv-art-ring">
              <div className="tv-art-shield">
                <svg
                  viewBox="0 0 220 240"
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  focusable="false"
                >
                  <defs>
                    <linearGradient id="tvShieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d9a7ff" />
                      <stop offset="48%" stopColor="#6b5cff" />
                      <stop offset="100%" stopColor="#00d9ff" />
                    </linearGradient>
                    <linearGradient id="tvShieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#c9dcff" />
                    </linearGradient>
                    <linearGradient id="tvDocumentStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#853eff" />
                      <stop offset="100%" stopColor="#087dff" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M110 12 L190 48 V106 C190 159 156 198 110 224 C64 198 30 159 30 106 V48 Z"
                    fill="url(#tvShieldFill)"
                    stroke="url(#tvShieldStroke)"
                    strokeWidth="7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M110 31 L173 59 V105 C173 148 146 181 110 202 C74 181 47 148 47 105 V59 Z"
                    fill="none"
                    stroke="#8d78ff"
                    strokeWidth="4"
                  />
                  <path
                    d="M79 67 H136 L158 89 V151 Q158 164 145 164 H79 Q66 164 66 151 V80 Q66 67 79 67 Z"
                    fill="#ffffff"
                    stroke="url(#tvDocumentStroke)"
                    strokeWidth="6"
                  />
                  <path
                    d="M136 68 V84 Q136 89 142 89 H157 M83 101 H129 M83 116 H132 M83 131 H113"
                    fill="none"
                    stroke="url(#tvDocumentStroke)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M100 154 V139 A17 17 0 0 1 134 139 V154"
                    fill="none"
                    stroke="#2438a8"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <rect
                    x="88"
                    y="150"
                    width="58"
                    height="48"
                    rx="11"
                    fill="#8aafff"
                    stroke="#263bb7"
                    strokeWidth="6"
                  />
                  <circle cx="117" cy="168" r="6" fill="#263bb7" />
                  <path
                    d="M117 174 V183"
                    stroke="#263bb7"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <div className="tv-demo-notice" role="status">
          <span aria-hidden="true">ⓘ</span>
          <span>
            <strong>Live data:</strong> Document information below comes from
            the authenticated backend response. Audit events and sharing
            statistics are not yet connected.
          </span>
        </div>

        <section className="tv-metrics" aria-label="Workspace summary">
          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>My documents</span>
              <span className="tv-metric-icon gold">▤</span>
            </div>
            <strong className="tv-metric-number">
              {documentsLoading ? "…" : documentsError ? "—" : documents.length}
            </strong>
            <p>Documents returned by the backend</p>
          </article>

          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Shared documents</span>
              <span className="tv-metric-icon blue">⇄</span>
            </div>
            <strong className="tv-metric-number">—</strong>
            <p>Sharing statistics not connected</p>
          </article>

          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Protected status</span>
              <span className="tv-metric-icon green">✓</span>
            </div>
            <strong className="tv-metric-number">—</strong>
            <p>Protection summary not connected</p>
          </article>

          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Needs review</span>
              <span className="tv-metric-icon amber">!</span>
            </div>
            <strong className="tv-metric-number">—</strong>
            <p>Review workflow not connected</p>
          </article>
        </section>

        <section className="tv-content-grid">
          <article className="tv-panel tv-documents-panel">
            <div className="tv-panel-header">
              <div>
                <h2>Recent Documents</h2>
                <p>Search your actual document list.</p>
              </div>

              <button
                type="button"
                className="tv-outline-button"
                onClick={handleUploadClick}
              >
                + Upload
              </button>
            </div>

            <label className="tv-search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search by name, status, or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search documents"
              />
            </label>

            <div className="tv-document-list">
              {documentsLoading && (
                <div className="tv-empty-state">
                  <strong>Loading your documents…</strong>
                  <p>Contacting the TrustVault backend.</p>
                </div>
              )}

              {!documentsLoading && documentsError && (
                <div className="tv-empty-state" role="alert">
                  <strong>Unable to load documents</strong>
                  <p>{documentsError}</p>
                  <button
                    type="button"
                    className="tv-outline-button"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!documentsLoading &&
                !documentsError &&
                filteredDocuments.map((document) => (
                  <div className="tv-document-row" key={document.id}>
                    <div className="tv-file-icon">▤</div>

                    <div className="tv-document-info">
                      <strong>{document.name}</strong>
                      <span>
                        Uploaded: {document.updated} · ID: {document.id}
                      </span>
                    </div>

                    <div className="tv-document-badges">
                      <span className="tv-badge private">
                        My document
                      </span>
                      <span className="tv-badge">
                        {document.status}
                      </span>
                    </div>
                  </div>
                ))}

              {!documentsLoading &&
                !documentsError &&
                filteredDocuments.length === 0 && (
                  <div className="tv-empty-state">
                    <span>⌕</span>
                    <strong>
                      {documents.length === 0
                        ? "No documents yet"
                        : "No matching documents"}
                    </strong>
                    <p>
                      {documents.length === 0
                        ? "Upload a document to see it here."
                        : "Try another name, status, or document ID."}
                    </p>
                  </div>
                )}
            </div>

            <div className="tv-panel-footer">
              <span>
                {documentsLoading
                  ? "Loading documents…"
                  : documentsError
                    ? "Document list unavailable"
                    : `Showing ${filteredDocuments.length} of ${documents.length} documents`}
              </span>
              <Link to="/documents">View all documents →</Link>
            </div>
          </article>

          <article className="tv-panel tv-overview-panel">
            <div className="tv-panel-header">
              <div>
                <h2>Access Overview</h2>
                <p>Security information status</p>
              </div>
              <span className="tv-metric-icon gold">◆</span>
            </div>

            <div className="tv-overview-summary">
              <strong>—</strong>
              <span>Access statistics not yet connected</span>
            </div>

            <div className="tv-chart-disclaimer">
              The dashboard does not yet receive shared-document counts,
              blocked attempts, or protection statistics from the backend.
            </div>

            <Link to="/permissions" className="tv-callout">
              <span className="tv-callout-icon">♙</span>
              <span>
                <strong>Review document permissions</strong>
                <small>Check who should be able to access each file.</small>
              </span>
              <span className="tv-callout-arrow">→</span>
            </Link>

            <Link to="/audit-log" className="tv-callout">
              <span className="tv-callout-icon">◷</span>
              <span>
                <strong>Inspect audit trail</strong>
                <small>Review recorded access and permission events.</small>
              </span>
              <span className="tv-callout-arrow">→</span>
            </Link>
          </article>
        </section>

        <section className="tv-panel tv-audit-panel">
          <div className="tv-panel-header tv-audit-heading">
            <div>
              <h2>Recent Audit Activity</h2>
              <p>Real audit events are not connected yet.</p>
            </div>

            <Link to="/audit-log" className="tv-outline-button">
              View audit logs
            </Link>
          </div>

          <div className="tv-table-wrap">
            <table className="tv-audit-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Document</th>
                  <th>Actor</th>
                  <th>Time</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="tv-table-empty">
                    No audit events loaded. Connect a backend audit-log
                    endpoint before displaying real activity.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="tv-audit-note">
            <span>ⓘ</span>
            <p>
              Audit evidence must be recorded and protected by the backend.
              This dashboard does not invent audit events.
            </p>
          </div>
        </section>

        <footer className="tv-footer">
          <span>TrustVault · Secure document sharing</span>
          <span>Security depends on server-side enforcement and testing.</span>
        </footer>
      </main>
    </div>
  );
}