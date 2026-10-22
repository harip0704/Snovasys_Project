
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./SharedDocuments.css";

type Theme = "light" | "dark";
type DocumentStatus = "Active" | "Expiring soon" | "Revoked";

type SharedDocument = {
  id: number;
  name: string;
  category: string;
  owner: string;
  sharedDate: string;
  expiryDate: string;
  status: DocumentStatus;
  permission: string;
};

const demoSharedDocuments: SharedDocument[] = [
  {
    id: 1,
    name: "Client Contract.pdf",
    category: "Contracts",
    owner: "Ravi Kumar",
    sharedDate: "20 Oct 2026",
    expiryDate: "30 Oct 2026",
    status: "Active",
    permission: "View",
  },
  {
    id: 2,
    name: "Security Policy.pdf",
    category: "Policies",
    owner: "Admin",
    sharedDate: "19 Oct 2026",
    expiryDate: "25 Oct 2026",
    status: "Expiring soon",
    permission: "View and download",
  },
  {
    id: 3,
    name: "Project Proposal.docx",
    category: "Other",
    owner: "Priya Sharma",
    sharedDate: "18 Oct 2026",
    expiryDate: "Access revoked",
    status: "Revoked",
    permission: "Revoked",
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

export default function SharedDocuments() {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [feedback, setFeedback] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const [documents] = useState<SharedDocument[]>(demoSharedDocuments);

  const [profileView, setProfileView] = useState<
    "none" | "profile" | "settings" | "logout"
  >("none");

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);

    try {
      localStorage.setItem("trustvault-theme", nextTheme);
    } catch {
      // Theme still changes for this page if storage is unavailable.
    }
  }

  const filteredDocuments = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        document.name.toLowerCase().includes(searchTerm) ||
        document.owner.toLowerCase().includes(searchTerm) ||
        document.category.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "All statuses" ||
        document.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All categories" ||
        document.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [documents, search, statusFilter, categoryFilter]);

  const activeCount = documents.filter(
    (document) => document.status === "Active",
  ).length;

  const expiringCount = documents.filter(
    (document) => document.status === "Expiring soon",
  ).length;

  const revokedCount = documents.filter(
    (document) => document.status === "Revoked",
  ).length;

  function clearFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setCategoryFilter("All categories");
  }

  function openProfileView(
    view: "profile" | "settings" | "logout",
  ) {
    setProfileView(view);
    setProfileOpen(false);

    if (view === "profile") {
      setFeedback("Profile: Hari | Role: Admin | TrustVault workspace");
    } else if (view === "settings") {
      setFeedback(
        "Settings demo: theme preference is available on this page.",
      );
    } else {
      setFeedback(
        "Demo logout selected. Actual sign-out will require authentication integration.",
      );
    }
  }

  function viewDocument(document: SharedDocument) {
    if (document.status === "Revoked") {
      setFeedback(
        `Access to "${document.name}" has been revoked in this demo.`,
      );
      return;
    }

    setFeedback(
      `"${document.name}" selected. Actual secure document access requires backend authorization.`,
    );
  }

  return (
    <div className={`shared-page ${theme === "dark" ? "theme-dark" : ""}`}>
      <header className="shared-topbar">
        <Link to="/dashboard" className="shared-brand">
          <span className="shared-brand-icon" aria-hidden="true">
            🔐
          </span>

          <span>
            <strong>TrustVault</strong>
            <small>SECURE DOCUMENT WORKSPACE</small>
          </span>
        </Link>

        <nav className="shared-topbar-nav" aria-label="Main navigation">
          <Link to="/dashboard" className="shared-nav-link">
            Dashboard
          </Link>

          <Link to="/documents" className="shared-nav-link">
            My Documents
          </Link>

          <Link
            to="/shared-documents"
            className="shared-nav-link shared-nav-active"
            aria-current="page"
          >
            Shared Documents
          </Link>
        </nav>

        <div className="shared-topbar-actions">
          <button
            type="button"
            className="shared-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          <div className="shared-profile-container">
            <button
              type="button"
              className="shared-avatar"
              title="Open Hari's profile menu"
              aria-label="Open Hari's profile menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              H
            </button>

            {profileOpen && (
              <div className="shared-profile-menu">
                <div className="shared-profile-menu-header">
                  <span className="shared-avatar shared-menu-avatar">H</span>
                  <div>
                    <strong>Hari</strong>
                    <small>Administrator</small>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openProfileView("profile")}
                >
                  <span aria-hidden="true">👤</span>
                  My Profile
                </button>

                <button
                  type="button"
                  onClick={() => openProfileView("settings")}
                >
                  <span aria-hidden="true">⚙️</span>
                  Settings
                </button>

                <div className="shared-profile-menu-divider" />

                <button
                  type="button"
                  className="shared-logout-option"
                  onClick={() => openProfileView("logout")}
                >
                  <span aria-hidden="true">↪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="shared-content">
        <section className="shared-heading">
          <div>
            <p className="shared-eyebrow">DOCUMENT ACCESS MANAGEMENT</p>
            <h1>Shared Documents</h1>
            <p className="shared-subtitle">
              Review documents shared with others, their permissions, and
              access status.
            </p>
          </div>

          <Link to="/documents" className="shared-primary-button">
            + Manage Documents
          </Link>
        </section>

        <section className="shared-security-notice">
          <span aria-hidden="true">🛡️</span>
          <p>
            <strong>Security reminder:</strong> Only authorized users should
            access confidential documents. Revoked entries are shown here as
            demo records; actual access enforcement must be handled by the
            backend.
          </p>
        </section>

        {feedback && (
          <section className="shared-feedback" role="status">
            <p>{feedback}</p>
            <button
              type="button"
              onClick={() => setFeedback("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </section>
        )}

        {profileView !== "none" && (
          <section className="shared-profile-detail" aria-live="polite">
            <div>
              <strong>
                {profileView === "profile"
                  ? "My Profile"
                  : profileView === "settings"
                    ? "Settings"
                    : "Logout"}
              </strong>
              <p>
                {profileView === "profile"
                  ? "Name: Hari · Role: Administrator"
                  : profileView === "settings"
                    ? "Use the theme button in the header to switch between light and dark mode."
                    : "This is a demo action. Your account has not been signed out."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setProfileView("none")}
              aria-label="Close profile details"
            >
              Close
            </button>
          </section>
        )}

        <section className="shared-stats" aria-label="Sharing statistics">
          <article className="shared-stat-card">
            <span className="shared-stat-icon" aria-hidden="true">
              📁
            </span>
            <div>
              <p>Total Shared Records</p>
              <h2>{documents.length}</h2>
            </div>
          </article>

          <article className="shared-stat-card">
            <span
              className="shared-stat-icon shared-icon-success"
              aria-hidden="true"
            >
              ✓
            </span>
            <div>
              <p>Active Access</p>
              <h2>{activeCount}</h2>
            </div>
          </article>

          <article className="shared-stat-card">
            <span
              className="shared-stat-icon shared-icon-warning"
              aria-hidden="true"
            >
              ◷
            </span>
            <div>
              <p>Expiring Soon</p>
              <h2>{expiringCount}</h2>
            </div>
          </article>

          <article className="shared-stat-card">
            <span
              className="shared-stat-icon shared-icon-danger"
              aria-hidden="true"
            >
              ⊘
            </span>
            <div>
              <p>Revoked Access</p>
              <h2>{revokedCount}</h2>
            </div>
          </article>
        </section>

        <section className="shared-panel">
          <div className="shared-panel-heading">
            <div>
              <h2>Document Sharing Activity</h2>
              <p>Search and filter the shared document records.</p>
            </div>

            <span className="shared-record-count">
              {filteredDocuments.length} records
            </span>
          </div>

          <div className="shared-filters">
            <label className="shared-search">
              <span aria-hidden="true">⌕</span>
              <span className="shared-visually-hidden">
                Search shared documents
              </span>
              <input
                type="search"
                placeholder="Search document, owner, category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="shared-select-label">
              <span className="shared-visually-hidden">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All statuses</option>
                <option>Active</option>
                <option>Expiring soon</option>
                <option>Revoked</option>
              </select>
            </label>

            <label className="shared-select-label">
              <span className="shared-visually-hidden">
                Filter by category
              </span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option>All categories</option>
                <option>Contracts</option>
                <option>Policies</option>
                <option>Other</option>
              </select>
            </label>

            <button
              type="button"
              className="shared-clear-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>

          <div className="shared-table-wrap">
            <table className="shared-table">
              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>OWNER</th>
                  <th>CATEGORY</th>
                  <th>SHARED DATE</th>
                  <th>EXPIRY / ACCESS</th>
                  <th>STATUS</th>
                  <th>PERMISSION</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <div className="shared-document-name">
                          <span className="shared-file-icon" aria-hidden="true">
                            {document.name.endsWith(".pdf") ? "PDF" : "DOC"}
                          </span>
                          <strong>{document.name}</strong>
                        </div>
                      </td>
                      <td>{document.owner}</td>
                      <td>{document.category}</td>
                      <td>{document.sharedDate}</td>
                      <td>{document.expiryDate}</td>
                      <td>
                        <span
                          className={`shared-status shared-status-${document.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {document.status}
                        </span>
                      </td>
                      <td>{document.permission}</td>
                      <td>
                        <button
                          type="button"
                          className="shared-view-button"
                          onClick={() => viewDocument(document)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="shared-empty" colSpan={8}>
                      <strong>No matching documents found</strong>
                      <p>Try changing your search or filters.</p>
                      <button type="button" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="shared-footnote">
            Demo data only. Secure downloads, permission changes, audit events,
            and actual revocation require backend authorization and storage
            integration.
          </p>
        </section>

        <footer className="shared-footer">
          <span>TrustVault · Secure document sharing</span>
          <span>Access should be granted only to authorized users.</span>
        </footer>
      </main>
    </div>
  );
}
