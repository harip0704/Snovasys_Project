import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.css";

type DocumentStatus = "Protected" | "Needs review" | "Restricted";
type AuditStatus = "Allowed" | "Denied" | "Revoked" | "Updated";

type DocumentItem = {
  id: string;
  name: string;
  category: string;
  owner: string;
  updated: string;
  status: DocumentStatus;
  sharing: "Private" | "Shared";
};

type AuditEvent = {
  id: number;
  action: string;
  document: string;
  actor: string;
  time: string;
  status: AuditStatus;
};

const initialDocuments: DocumentItem[] = [
  {
    id: "DOC-1001",
    name: "Employment Agreement.pdf",
    category: "Legal",
    owner: "Hari",
    updated: "Today",
    status: "Protected",
    sharing: "Private",
  },
  {
    id: "DOC-1002",
    name: "Client Contract.pdf",
    category: "Contracts",
    owner: "Hari",
    updated: "Yesterday",
    status: "Protected",
    sharing: "Shared",
  },
  {
    id: "DOC-1003",
    name: "Financial Report.xlsx",
    category: "Finance",
    owner: "Hari",
    updated: "22 Oct 2026",
    status: "Needs review",
    sharing: "Private",
  },
  {
    id: "DOC-1004",
    name: "Project Blueprint.docx",
    category: "Engineering",
    owner: "Hari",
    updated: "21 Oct 2026",
    status: "Protected",
    sharing: "Shared",
  },
];

const sampleAuditEvents: AuditEvent[] = [
  {
    id: 1,
    action: "Document access",
    document: "Employment Agreement.pdf",
    actor: "Hari",
    time: "Today · 10:42 AM",
    status: "Allowed",
  },
  {
    id: 2,
    action: "Access attempt",
    document: "Financial Report.xlsx",
    actor: "Unverified user",
    time: "Today · 10:18 AM",
    status: "Denied",
  },
  {
    id: 3,
    action: "Permission revoked",
    document: "Client Contract.pdf",
    actor: "Hari",
    time: "Today · 09:55 AM",
    status: "Revoked",
  },
  {
    id: 4,
    action: "Document updated",
    document: "Project Blueprint.docx",
    actor: "Hari",
    time: "Yesterday · 04:20 PM",
    status: "Updated",
  },
];

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
  const [auditFilter, setAuditFilter] = useState("All events");
  const [documents] = useState(initialDocuments);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("trustvault-theme") === "dark";
    } catch {
      return false;
    }
  });

  const protectedCount = documents.filter(
    (document) => document.status === "Protected"
  ).length;

  const reviewCount = documents.filter(
    (document) => document.status === "Needs review"
  ).length;

  const sharedCount = documents.filter(
    (document) => document.sharing === "Shared"
  ).length;

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return documents;

    return documents.filter((document) =>
      [
        document.name,
        document.category,
        document.owner,
        document.status,
        document.sharing,
        document.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [documents, search]);

  const filteredAuditEvents = useMemo(() => {
    if (auditFilter === "All events") return sampleAuditEvents;

    return sampleAuditEvents.filter(
      (event) => event.status === auditFilter
    );
  }, [auditFilter]);

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
            <i /> Demo workspace
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
              <span>▤</span>
              <span>♙</span>
              <span>♢</span>
            </div>
          </div>
        </section>

        <div className="tv-demo-notice" role="note">
          <span aria-hidden="true">ⓘ</span>
          <span>
            <strong>Demo data:</strong> The figures and activity below are
            illustrative frontend examples, not verified security events.
          </span>
        </div>

        <section className="tv-metrics" aria-label="Workspace summary">
          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Total documents</span>
              <span className="tv-metric-icon gold">▤</span>
            </div>
            <strong className="tv-metric-number">{documents.length}</strong>
            <p>Documents in demo workspace</p>
          </article>

          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Shared documents</span>
              <span className="tv-metric-icon blue">⇄</span>
            </div>
            <strong className="tv-metric-number">{sharedCount}</strong>
            <p>Marked as shared in demo data</p>
          </article>

          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Protected status</span>
              <span className="tv-metric-icon green">✓</span>
            </div>
            <strong className="tv-metric-number green-text">
              {protectedCount}
            </strong>
            <p>Marked protected in demo data</p>
          </article>

          <article className="tv-metric-card">
            <div className="tv-metric-heading">
              <span>Needs review</span>
              <span className="tv-metric-icon amber">!</span>
            </div>
            <strong className="tv-metric-number amber-text">
              {reviewCount}
            </strong>
            <p>Documents requiring review</p>
          </article>
        </section>

        <section className="tv-content-grid">
          <article className="tv-panel tv-documents-panel">
            <div className="tv-panel-header">
              <div>
                <h2>Recent Documents</h2>
                <p>Search and review your document list.</p>
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
                placeholder="Search by name, category, owner, or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search documents"
              />
            </label>

            <div className="tv-document-list">
              {filteredDocuments.map((document) => (
                <div className="tv-document-row" key={document.id}>
                  <div className="tv-file-icon">▤</div>

                  <div className="tv-document-info">
                    <strong>{document.name}</strong>
                    <span>
                      {document.category} · {document.updated} · {document.id}
                    </span>
                  </div>

                  <div className="tv-document-badges">
                    <span
                      className={`tv-badge ${
                        document.sharing === "Shared" ? "shared" : "private"
                      }`}
                    >
                      {document.sharing}
                    </span>

                    <span
                      className={`tv-badge ${
                        document.status === "Protected"
                          ? "protected"
                          : "review"
                      }`}
                    >
                      {document.status}
                    </span>
                  </div>
                </div>
              ))}

              {filteredDocuments.length === 0 && (
                <div className="tv-empty-state">
                  <span>⌕</span>
                  <strong>No matching documents</strong>
                  <p>Try a different name, category, or document ID.</p>
                </div>
              )}
            </div>

            <div className="tv-panel-footer">
              <span>Showing {filteredDocuments.length} demo documents</span>
              <Link to="/documents">View all documents →</Link>
            </div>
          </article>

          <article className="tv-panel tv-overview-panel">
            <div className="tv-panel-header">
              <div>
                <h2>Access Overview</h2>
                <p>Document status summary</p>
              </div>
              <span className="tv-metric-icon gold">◆</span>
            </div>

            <div className="tv-overview-summary">
              <strong>{protectedCount}</strong>
              <span>documents marked protected</span>
            </div>

            <div
              className="tv-bar-chart"
              aria-label="Illustrative document status chart"
            >
              <div className="tv-chart-column">
                <strong>{protectedCount}</strong>
                <div className="tv-chart-track">
                  <div
                    className="tv-chart-bar green-bar"
                    style={{
                      height: `${
                        (protectedCount / Math.max(documents.length, 1)) * 100
                      }%`,
                    }}
                  />
                </div>
                <span>Protected</span>
              </div>

              <div className="tv-chart-column">
                <strong>{reviewCount}</strong>
                <div className="tv-chart-track">
                  <div
                    className="tv-chart-bar amber-bar"
                    style={{
                      height: `${
                        (reviewCount / Math.max(documents.length, 1)) * 100
                      }%`,
                    }}
                  />
                </div>
                <span>Review</span>
              </div>

              <div className="tv-chart-column">
                <strong>—</strong>
                <div className="tv-chart-track">
                  <div className="tv-chart-bar red-bar" style={{ height: 0 }} />
                </div>
                <span>Blocked</span>
              </div>
            </div>

            <p className="tv-chart-disclaimer">
              Blocked attempts are not calculated from real server logs yet.
            </p>

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
                <small>Review access, denial, and revocation events.</small>
              </span>
              <span className="tv-callout-arrow">→</span>
            </Link>
          </article>
        </section>

        <section className="tv-panel tv-audit-panel">
          <div className="tv-panel-header tv-audit-heading">
            <div>
              <h2>Recent Audit Activity</h2>
              <p>Illustrative events for the dashboard preview.</p>
            </div>

            <div className="tv-audit-actions">
              <label className="tv-filter-label">
                <span className="tv-sr-only">Filter audit events</span>
                <select
                  value={auditFilter}
                  onChange={(event) => setAuditFilter(event.target.value)}
                >
                  <option>All events</option>
                  <option>Allowed</option>
                  <option>Denied</option>
                  <option>Revoked</option>
                  <option>Updated</option>
                </select>
              </label>

              <Link to="/audit-log" className="tv-outline-button">
                View audit logs
              </Link>
            </div>
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
                {filteredAuditEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.action}</td>
                    <td>{event.document}</td>
                    <td>{event.actor}</td>
                    <td>{event.time}</td>
                    <td>
                      <span
                        className={`tv-audit-status ${event.status.toLowerCase()}`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredAuditEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="tv-table-empty">
                      No events match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tv-audit-note">
            <span>ⓘ</span>
            <p>
              A production audit trail must be recorded and protected by the
              backend. Client-side sample events can be edited and are not
              proof of actual access.
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