
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Link } from "react-router-dom";
import "./Documents.css";

type Theme = "light" | "dark";
type DocumentStatus = "Protected" | "Restricted";
type UploadStatus = "Ready for review" | "Rejected";

type DocumentItem = {
  id: number;
  name: string;
  category: string;
  owner: string;
  updated: string;
  status: DocumentStatus;
};

type UploadAttempt = {
  id: string;
  name: string;
  size: number;
  extension: string;
  status: UploadStatus;
  detail: string;
  addedAt: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RECENT_FILES = 5;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

const CATEGORIES = [
  "Legal",
  "Contracts",
  "Finance",
  "Policies",
  "Other",
];

const demoDocuments: DocumentItem[] = [
  {
    id: 1,
    name: "Employment Agreement.pdf",
    category: "Legal",
    owner: "Admin",
    updated: "21 Oct 2026",
    status: "Protected",
  },
  {
    id: 2,
    name: "Client Contract.pdf",
    category: "Contracts",
    owner: "Priya",
    updated: "20 Oct 2026",
    status: "Protected",
  },
  {
    id: 3,
    name: "Salary Statement.pdf",
    category: "Finance",
    owner: "HR Team",
    updated: "19 Oct 2026",
    status: "Restricted",
  },
  {
    id: 4,
    name: "Security Policy.pdf",
    category: "Policies",
    owner: "Admin",
    updated: "18 Oct 2026",
    status: "Protected",
  },
];

function getInitialTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index > 0 && index < name.length - 1
    ? name.slice(index + 1).toUpperCase()
    : "FILE";
}

export default function Documents() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploadAttempts, setUploadAttempts] = useState<UploadAttempt[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the visual theme consistent with the rest of the application.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("trustvault-theme", theme);
    } catch {
      // Theme remains usable when local storage is unavailable.
    }
  }, [theme]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return demoDocuments.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(query) ||
        doc.owner.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" || doc.category === category;

      const matchesStatus =
        statusFilter === "All" || doc.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, statusFilter]);

  const protectedCount = demoDocuments.filter(
    (doc) => doc.status === "Protected",
  ).length;

  function showMessage(text: string, type: "info" | "error" = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  function handleUploadClick() {
    setMessage("");
    fileInputRef.current?.click();
  }

  function addUploadAttempt(
    file: File,
    status: UploadStatus,
    detail: string,
  ) {
    const attempt: UploadAttempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      extension: getExtension(file.name),
      status,
      detail,
      addedAt: new Date().toLocaleString(),
    };

    setUploadAttempts((current) =>
      [attempt, ...current].slice(0, MAX_RECENT_FILES),
    );
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isAllowed = ALLOWED_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!isAllowed) {
      const reason =
        "Unsupported file type. Choose PDF, DOC, DOCX, or TXT.";

      addUploadAttempt(file, "Rejected", reason);
      showMessage(reason, "error");
      input.value = "";
      return;
    }

    if (file.size === 0) {
      const reason = "The selected file is empty. Choose another file.";

      addUploadAttempt(file, "Rejected", reason);
      showMessage(reason, "error");
      input.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const reason = "File exceeds the 10 MB demo limit.";

      addUploadAttempt(file, "Rejected", reason);
      showMessage(reason, "error");
      input.value = "";
      return;
    }

    addUploadAttempt(
      file,
      "Ready for review",
      "Basic browser checks passed. The file has NOT been uploaded to secure storage.",
    );

    showMessage(
      "Validation passed. Secure upload is not connected yet; this file remains on your device.",
    );

    // Allow the same file to be selected again.
    input.value = "";
  }

  function removeUploadAttempt(id: string, name: string) {
    setUploadAttempts((current) =>
      current.filter((item) => item.id !== id),
    );

    showMessage(
      `${name} was removed from recent activity only. No stored file was deleted.`,
    );
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setStatusFilter("All");
  }

  function handleViewDetails(doc: DocumentItem) {
    showMessage(
      `${doc.name}: demo record only. Document details and access checks require the secure backend.`,
    );
  }

  return (
    <main className={`documents-page theme-${theme}`}>
      <header className="documents-topbar">
        <Link to="/dashboard" className="documents-brand">
          <span className="documents-brand-icon" aria-hidden="true">
            ◆
          </span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE WORKSPACE</small>
          </span>
        </Link>

        <div className="documents-topbar-actions">
          <Link to="/dashboard" className="documents-back-link">
            ← Dashboard
          </Link>

          <button
            className="documents-theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
          >
            <span aria-hidden="true">
              {theme === "light" ? "☾" : "☀"}
            </span>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </header>

      <section className="documents-content">
        <header className="documents-header">
          <div>
            <p className="documents-eyebrow">
              TRUSTVAULT / FILE MANAGEMENT
            </p>
            <h1>My Documents</h1>
            <p className="documents-subtitle">
              Manage document records, review validation, and inspect
              demo access status.
            </p>
          </div>

          <button
            className="documents-upload-btn"
            type="button"
            onClick={handleUploadClick}
          >
            <span aria-hidden="true">＋</span>
            Upload Document
          </button>

          <input
            ref={fileInputRef}
            id="document-file-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            hidden
            onChange={handleFileChange}
          />
        </header>

        <div className="documents-demo-note" role="note">
          <strong>Development mode:</strong> document rows below are
          sample records. Browser validation is not a security boundary.
          Server-side authentication, authorization, file validation,
          private storage, and audit logging are still required.
        </div>

        {message && (
          <div
            className="documents-message"
            role={messageType === "error" ? "alert" : "status"}
          >
            <span aria-hidden="true">
              {messageType === "error" ? "⚠" : "ⓘ"}
            </span>
            <p>{message}</p>
            <button
              type="button"
              className="documents-message-close"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section
          className="documents-upload-activity"
          aria-labelledby="recent-uploads-title"
        >
          <div className="documents-upload-heading">
            <div>
              <h2 id="recent-uploads-title">Recent Upload Activity</h2>
              <p>
                Review local file selections and basic validation results.
              </p>
            </div>
            <span className="documents-upload-count">
              {uploadAttempts.length} / {MAX_RECENT_FILES}
            </span>
          </div>

          {uploadAttempts.length === 0 ? (
            <div className="documents-upload-empty">
              <span
                className="documents-upload-empty-icon"
                aria-hidden="true"
              >
                ▤
              </span>
              <strong>No recent files</strong>
              <p>
                Choose Upload Document to check a file. The selection
                appears here, but is not sent to a server.
              </p>
            </div>
          ) : (
            <div className="documents-upload-list">
              {uploadAttempts.map((file) => {
                const rejected = file.status === "Rejected";

                return (
                  <article
                    className="documents-upload-card"
                    key={file.id}
                  >
                    <div
                      className={`documents-upload-file-type ${
                        rejected
                          ? "upload-file-type-rejected"
                          : "upload-file-type-ready"
                      }`}
                      aria-hidden="true"
                    >
                      {file.extension}
                    </div>

                    <div className="documents-upload-file-info">
                      <h3 title={file.name}>{file.name}</h3>
                      <p className="documents-upload-meta">
                        {formatFileSize(file.size)} · {file.addedAt}
                      </p>

                      <span
                        className={`documents-upload-status ${
                          rejected
                            ? "upload-status-rejected"
                            : "upload-status-ready"
                        }`}
                      >
                        <span aria-hidden="true">●</span>
                        {file.status}
                      </span>

                      <p
                        className={`documents-upload-detail ${
                          rejected ? "upload-detail-rejected" : ""
                        }`}
                      >
                        {file.detail}
                      </p>
                    </div>

                    <button
                      className="documents-upload-remove"
                      type="button"
                      onClick={() =>
                        removeUploadAttempt(file.id, file.name)
                      }
                      aria-label={`Remove ${file.name} from recent activity`}
                    >
                      Remove
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <p className="documents-upload-note">
            This list exists only in the current page session. Removing
            an entry does not delete a file from your device or storage.
          </p>
        </section>

        <section
          className="documents-stats"
          aria-label="Demo document statistics"
        >
          <article className="document-stat-card">
            <span className="document-stat-icon" aria-hidden="true">
              ▤
            </span>
            <div>
              <p>Sample Documents</p>
              <h2>{demoDocuments.length}</h2>
            </div>
          </article>

          <article className="document-stat-card">
            <span className="document-stat-icon" aria-hidden="true">
              🔒
            </span>
            <div>
              <p>Marked Protected (Demo)</p>
              <h2>{protectedCount}</h2>
            </div>
          </article>

          <article className="document-stat-card">
            <span className="document-stat-icon" aria-hidden="true">
              ◈
            </span>
            <div>
              <p>Categories</p>
              <h2>
                {new Set(demoDocuments.map((doc) => doc.category)).size}
              </h2>
            </div>
          </article>
        </section>

        <section className="documents-panel">
          <div className="documents-panel-heading">
            <div>
              <h2>All Documents</h2>
              <p>Search and filter the sample document list.</p>
            </div>
            <span className="documents-count">
              {filteredDocuments.length}{" "}
              {filteredDocuments.length === 1 ? "record" : "records"}
            </span>
          </div>

          <div className="documents-filters">
            <label className="documents-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search document, owner, or category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search documents"
              />
            </label>

            <label className="documents-category">
              <span className="visually-hidden">
                Filter by category
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="documents-category">
              <span className="visually-hidden">
                Filter by demo status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Demo Statuses</option>
                <option value="Protected">Marked Protected</option>
                <option value="Restricted">Marked Restricted</option>
              </select>
            </label>
          </div>

          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Last Updated</th>
                  <th>Demo Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="document-name-cell">
                        <span className="document-file-icon">
                          {getExtension(doc.name)}
                        </span>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.category}</td>
                    <td>{doc.owner}</td>
                    <td>{doc.updated}</td>
                    <td>
                      <span
                        className={`document-security ${
                          doc.status === "Protected"
                            ? "security-protected"
                            : "security-restricted"
                        }`}
                      >
                        <span aria-hidden="true">●</span>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="document-action-btn"
                        type="button"
                        onClick={() => handleViewDetails(doc)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="documents-empty">
                      <span aria-hidden="true">⌕</span>
                      <strong>No matching records</strong>
                      <p>
                        Try another search term or change the filters.
                      </p>
                      <button type="button" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="documents-demo-note">
            Demo records only. The word “Protected” here is a sample
            label, not proof of encryption or authorization. The backend
            must verify the signed-in user’s permission for every
            document request.
          </p>
        </section>

        <footer className="documents-footer">
          <span>TrustVault · Secure Document Sharing</span>
          <span>Access should always be intentional.</span>
        </footer>
      </section>
    </main>
  );
}
