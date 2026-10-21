
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

type DocumentItem = {
  id: number;
  name: string;
  category: string;
  owner: string;
  updated: string;
  access: "Private" | "Shared";
  status: "Protected" | "Review";
};

type Theme = "light" | "dark";

const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    name: "Employment Agreement.pdf",
    category: "Legal",
    owner: "You",
    updated: "Today",
    access: "Private",
    status: "Protected",
  },
  {
    id: 2,
    name: "Client Contract.pdf",
    category: "Contracts",
    owner: "You",
    updated: "Yesterday",
    access: "Shared",
    status: "Protected",
  },
  {
    id: 3,
    name: "Financial Report.xlsx",
    category: "Finance",
    owner: "You",
    updated: "20 Oct 2026",
    access: "Private",
    status: "Review",
  },
];

function getSavedTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("trustvault-theme", theme);
    } catch {
      // The theme still applies to the current page.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const documents = initialDocuments.filter((document) =>
    `${document.name} ${document.category} ${document.owner}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const navigation = [
    { name: "Dashboard", icon: "▦", path: "/dashboard" },
    { name: "My Documents", icon: "▤", path: "/documents" },
    { name: "Shared Documents", icon: "⇄", path: "/shared-documents" },
    { name: "Permissions", icon: "♙", path: "/permissions" },
    { name: "Audit Logs", icon: "◷", path: "/audit-logs" },
  ];

  return (
    <main className={`dashboard theme-${theme}`}>
      <aside className="dashboard-sidebar">
        <Link to="/dashboard" className="dashboard-brand">
          <span className="brand-shield">◆</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE WORKSPACE</small>
          </span>
        </Link>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`nav-item ${
                activeNav === item.name ? "nav-item-active" : ""
              }`}
              onClick={() => {
                setActiveNav(item.name);
                navigate(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-security">
          <span className="security-lock">♙</span>
          <strong>Security first</strong>
          <p>Every document deserves controlled access.</p>
          <span className="security-indicator">
            <span /> Security workspace
          </span>
        </div>

        <Link to="/login" className="sidebar-logout">
          ↪ Sign out
        </Link>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="breadcrumb">Workspace / Overview</span>
            <h1>Security Dashboard</h1>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
              aria-pressed={theme === "dark"}
            >
              <span aria-hidden="true">
                {theme === "light" ? "☾" : "☀"}
              </span>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>

            <div className="profile-chip">
              <span className="profile-avatar">U</span>
              <span>
                <strong>Workspace User</strong>
                <small>Document Owner</small>
              </span>
            </div>
          </div>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span className="eyebrow">YOUR SECURE WORKSPACE</span>
            <h2>Documents under your control.</h2>
            <p>
              Manage files, review access and monitor document activity
              from one place.
            </p>
          </div>

          <div className="welcome-emblem" aria-hidden="true">
            <span className="emblem-document">▤</span>
            <span className="emblem-lock">♙</span>
            <span className="emblem-key">⚿</span>
          </div>
        </section>

        <section className="dashboard-stats" aria-label="Document summary">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total Documents</span>
              <span className="stat-icon">▤</span>
            </div>
            <strong className="stat-value">12</strong>
            <span className="stat-caption">Documents in workspace</span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Shared Documents</span>
              <span className="stat-icon">⇄</span>
            </div>
            <strong className="stat-value">05</strong>
            <span className="stat-caption">
              Shared with authorised users
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Protected</span>
              <span className="stat-icon positive-icon">✓</span>
            </div>
            <strong className="stat-value positive-text">11</strong>
            <span className="stat-caption">
              Marked protected in demo data
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Needs Review</span>
              <span className="stat-icon warning-icon">!</span>
            </div>
            <strong className="stat-value warning-text">01</strong>
            <span className="stat-caption">Requires access review</span>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel documents-panel">
            <div className="panel-heading">
              <div>
                <h3>Recent Documents</h3>
                <p>Review your latest files and access status.</p>
              </div>

              <button
                className="outline-button"
                type="button"
                onClick={() =>
                  window.alert("Document upload will be implemented next.")
                }
              >
                + Upload Document
              </button>
            </div>

            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search documents or categories..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="document-list">
              {documents.map((document) => (
                <div className="document-row" key={document.id}>
                  <div className="document-icon">▤</div>

                  <div className="document-info">
                    <strong>{document.name}</strong>
                    <span>
                      {document.category} · {document.updated}
                    </span>
                  </div>

                  <span
                    className={`access-badge ${
                      document.access === "Shared"
                        ? "shared-badge"
                        : "private-badge"
                    }`}
                  >
                    {document.access}
                  </span>

                  <span
                    className={`status-badge ${
                      document.status === "Protected"
                        ? "protected-badge"
                        : "review-badge"
                    }`}
                  >
                    {document.status === "Protected" ? "✓ " : "! "}
                    {document.status}
                  </span>
                </div>
              ))}

              {documents.length === 0 && (
                <p className="empty-state">
                  No documents match your search.
                </p>
              )}
            </div>

            <p className="demo-note">
              Demo records only · Live documents will come from the backend.
            </p>
          </article>

          <article className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <h3>Security Overview</h3>
                <p>Illustrative access summary</p>
              </div>
              <span className="gold-shield">◆</span>
            </div>

            <div className="chart-summary">
              <div>
                <strong>85%</strong>
                <span>Illustrative protection score</span>
              </div>
              <span className="moderate-tag">Demo</span>
            </div>

            <div
              className="chart-bars"
              aria-label="Illustrative document status chart"
            >
              <div className="chart-column">
                <span className="bar-value">11</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-green"
                    style={{ height: "88%" }}
                  />
                </div>
                <span className="bar-label">Protected</span>
              </div>

              <div className="chart-column">
                <span className="bar-value">1</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-yellow"
                    style={{ height: "18%" }}
                  />
                </div>
                <span className="bar-label">Review</span>
              </div>

              <div className="chart-column">
                <span className="bar-value">0</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-red"
                    style={{ height: "3%" }}
                  />
                </div>
                <span className="bar-label">Blocked</span>
              </div>
            </div>

            <div className="chart-legend">
              <span><i className="legend-green" /> Protected</span>
              <span><i className="legend-yellow" /> Review</span>
              <span><i className="legend-red" /> Blocked</span>
            </div>

            <div className="audit-callout">
              <span className="audit-icon">◷</span>
              <div>
                <strong>Audit trail</strong>
                <p>Track who accessed a document and when.</p>
              </div>
            </div>

            <button
              className="audit-button"
              type="button"
              onClick={() => navigate("/audit-logs")}
            >
              View Audit Logs →
            </button>
          </article>
        </section>

        <footer className="dashboard-footer">
          <span>TrustVault · Secure Document Sharing</span>
          <span>Access should always be intentional.</span>
        </footer>
      </section>
    </main>
  );
}

export default Dashboard;
