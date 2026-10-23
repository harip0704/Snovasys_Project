import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Documents.css";

type Theme = "light" | "dark";
type DocumentStatus = "Protected" | "Restricted" | "Ready for review";
type UploadStatus = "Success" | "Rejected";

type DocumentItem = {
  id: string;
  name: string;
  category: string;
  owner: string;
  lastUpdated: string;
  status: DocumentStatus;
  size?: number;
};

type UploadAttempt = {
  id: string;
  name: string;
  status: UploadStatus;
  message: string;
  time: string;
  size?: number;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

const initialDocuments: DocumentItem[] = [
  {
    id: "doc-001",
    name: "Employment Agreement.pdf",
    category: "HR",
    owner: "Hari",
    lastUpdated: "Oct 22, 2026",
    status: "Protected",
    size: 245760,
  },
  {
    id: "doc-002",
    name: "Client Contract.docx",
    category: "Legal",
    owner: "Hari",
    lastUpdated: "Oct 21, 2026",
    status: "Restricted",
    size: 184320,
  },
  {
    id: "doc-003",
    name: "Salary Statement.pdf",
    category: "Finance",
    owner: "Hari",
    lastUpdated: "Oct 20, 2026",
    status: "Protected",
    size: 97280,
  },
  {
    id: "doc-004",
    name: "Security Policy.txt",
    category: "Security",
    owner: "Hari",
    lastUpdated: "Oct 19, 2026",
    status: "Ready for review",
    size: 12288,
  },
];

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
}

function getCurrentDate(): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function getCurrentTime(): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function readSavedTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function Documents() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<Theme>(readSavedTheme);
  const [documents, setDocuments] =
    useState<DocumentItem[]>(initialDocuments);
  const [uploadActivity, setUploadActivity] = useState<UploadAttempt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const categories = useMemo(
    () => [
      "All categories",
      ...Array.from(new Set(documents.map((doc) => doc.category))).sort(),
    ],
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesSearch =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        doc.owner.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All categories" ||
        doc.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All statuses" || doc.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchTerm, categoryFilter, statusFilter]);

  const protectedCount = documents.filter(
    (doc) => doc.status === "Protected",
  ).length;

  const restrictedCount = documents.filter(
    (doc) => doc.status === "Restricted",
  ).length;

  const reviewCount = documents.filter(
    (doc) => doc.status === "Ready for review",
  ).length;

  function showMessage(text: string) {
    setMessage(text);
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    try {
      localStorage.setItem("trustvault-theme", nextTheme);
    } catch {
      // Theme still changes for this page if storage is unavailable.
    }
  }

  function addActivity(activity: UploadAttempt) {
    setUploadActivity((previous) => [activity, ...previous].slice(0, 10));
  }

  function processFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    files.forEach((file) => {
      const extension = getFileExtension(file.name);
      let rejectionReason = "";

      if (file.size === 0) {
        rejectionReason = "The selected file is empty.";
      } else if (!ALLOWED_EXTENSIONS.includes(extension)) {
        rejectionReason =
          "Unsupported file type. Choose PDF, DOC, DOCX or TXT.";
      } else if (file.size > MAX_FILE_SIZE) {
        rejectionReason =
          "File exceeds the maximum allowed size of 10 MB.";
      }

      if (rejectionReason) {
        addActivity({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          status: "Rejected",
          message: rejectionReason,
          time: getCurrentTime(),
          size: file.size,
        });

        showMessage(`${file.name}: ${rejectionReason}`);
        return;
      }

      const duplicate = documents.some(
        (doc) => doc.name.toLowerCase() === file.name.toLowerCase(),
      );

      if (duplicate) {
        const duplicateMessage =
          "A document with this name already exists in the current list.";

        addActivity({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          status: "Rejected",
          message: duplicateMessage,
          time: getCurrentTime(),
          size: file.size,
        });

        showMessage(`${file.name}: ${duplicateMessage}`);
        return;
      }

      const newDocument: DocumentItem = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        category: "Other",
        owner: "Hari",
        lastUpdated: getCurrentDate(),
        status: "Ready for review",
        size: file.size,
      };
      

      setDocuments((previous) => [newDocument, ...previous]);

      addActivity({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "Success",
        message:
          "File selected successfully. It has not been uploaded to secure storage.",
        time: getCurrentTime(),
        size: file.size,
      });

      showMessage(
        `${file.name} selected successfully. Secure storage upload is not connected yet.`,
      );
    });

    setSearchTerm("");
    setCategoryFilter("All categories");
    setStatusFilter("All statuses");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    processFiles(event.target.files);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    processFiles(event.dataTransfer.files);
  }

  function removeActivity(id: string) {
    setUploadActivity((previous) =>
      previous.filter((activity) => activity.id !== id),
    );
    showMessage("Activity item removed from this page.");
  }

  function viewDocumentDetails(doc: DocumentItem) {
    showMessage(
      `${doc.name} — Category: ${doc.category}; Owner: ${doc.owner}; Status: ${doc.status}. Document details and access controls will be connected to the backend later.`,
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setCategoryFilter("All categories");
    setStatusFilter("All statuses");
    showMessage("Search and filters cleared.");
  }

  return (
    <div className={`documents-page theme-${theme}`}>
      <header className="documents-topbar">
        <Link
          to="/dashboard"
          className="documents-brand"
          aria-label="TrustVault dashboard"
        >
          <span className="documents-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.8 20 6v5.2c0 5.1-3.4 8.5-8 10-4.6-1.5-8-4.9-8-10V6l8-3.2Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="m8.7 11.9 2.2 2.2 4.5-4.7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="documents-brand-copy">
            <strong>TrustVault</strong>
            <small>Secure document workspace</small>
          </span>
        </Link>

        <div className="documents-topbar-actions">
          <Link to="/dashboard" className="documents-dashboard-link">
            <span aria-hidden="true">←</span> Dashboard
          </Link>

          <button
            type="button"
            className="documents-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </header>

      <main className="documents-main">
        <section className="documents-heading">
          <div>
            <p className="documents-eyebrow">
              <span className="documents-eyebrow-dot" />
              DOCUMENT WORKSPACE
            </p>
            <h1>My Documents</h1>
            <p className="documents-subtitle">
              Organize your files, review document status, and manage your
              workspace.
            </p>
          </div>

          <button
            type="button"
            className="documents-upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <span aria-hidden="true">＋</span> Select a document
          </button>

          <input
            ref={fileInputRef}
            className="documents-hidden-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileChange}
          />
        </section>

        {message && (
          <div className="documents-message" role="status">
            <span className="documents-message-icon" aria-hidden="true">
              ⓘ
            </span>
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section
          className="documents-summary-grid"
          aria-label="Document summary"
        >
          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-violet">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 3.5h8l4 4V20H6V3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 3.5V8h4M9 12h6M9 15.5h6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="documents-summary-label">Total documents</span>
            </div>
            <strong className="documents-summary-number">
              {documents.length}
            </strong>
            <span className="documents-summary-caption">
              Files in this workspace
            </span>
          </article>

          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-green">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="documents-summary-label">Protected</span>
            </div>
            <strong className="documents-summary-number">
              {protectedCount}
            </strong>
            <span className="documents-summary-caption">
              Marked as protected
            </span>
          </article>

          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M12 7.5v5l3.2 2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="documents-summary-label">Restricted</span>
            </div>
            <strong className="documents-summary-number">
              {restrictedCount}
            </strong>
            <span className="documents-summary-caption">
              Marked as restricted
            </span>
          </article>

          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-amber">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M12 7v5m0 4h.01"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="documents-summary-label">Ready for review</span>
            </div>
            <strong className="documents-summary-number">{reviewCount}</strong>
            <span className="documents-summary-caption">
              Awaiting review
            </span>
          </article>
        </section>

        <section className="documents-upload-panel">
          <div className="documents-section-heading">
            <div>
              <h2>Add documents</h2>
              <p>Select files to add them to this page's local list.</p>
            </div>
            <span className="documents-local-badge">
              <span /> Local preview
            </span>
          </div>

          <div
            className={`documents-dropzone ${dragging ? "is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
          >
            <span className="documents-dropzone-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <div className="documents-dropzone-copy">
              <strong>Drag and drop your files here</strong>
              <span>or select files from your computer</span>
              <small>PDF, DOC, DOCX or TXT · Maximum 10 MB per file</small>
            </div>

            <button
              type="button"
              className="documents-browse-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </button>
          </div>

          <div className="documents-security-note">
            <span aria-hidden="true">ⓘ</span>
            <p>
              <strong>Security note:</strong> Files are only selected in this
              browser and added to the page's current list. They are not
              uploaded to AWS S3 or secure server storage yet.
            </p>
          </div>
        </section>

        <section className="documents-list-panel">
          <div className="documents-section-heading documents-list-heading">
            <div>
              <h2>All documents</h2>
              <p>
                Browse your document list and check each item's current status.
              </p>
            </div>
            <span className="documents-result-count">
              {filteredDocuments.length}{" "}
              {filteredDocuments.length === 1 ? "document" : "documents"}
            </span>
          </div>

          <div className="documents-filters">
            <label className="documents-search">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="search"
                placeholder="Search by name, owner or category..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search documents"
              />
            </label>

            <select
              className="documents-filter-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className="documents-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All statuses">All statuses</option>
              <option value="Protected">Protected</option>
              <option value="Restricted">Restricted</option>
              <option value="Ready for review">Ready for review</option>
            </select>

            <button
              type="button"
              className="documents-clear-filters"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Category</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Last updated</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="documents-file-cell">
                        <span
                          className="documents-file-icon"
                          aria-hidden="true"
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="M6 3.5h8l4 4V20H6V3.5Z"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14 3.5V8h4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="documents-file-info">
                          <strong>{doc.name}</strong>
                          <small>{formatFileSize(doc.size)}</small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="documents-category">{doc.category}</span>
                    </td>

                    <td>
                      <span className="documents-owner">
                        <span className="documents-owner-avatar">
                          {doc.owner.charAt(0).toUpperCase()}
                        </span>
                        {doc.owner}
                      </span>
                    </td>

                    <td className="documents-date">{doc.lastUpdated}</td>

                    <td>
                      <span
                        className={`document-security ${
                          doc.status === "Protected"
                            ? "security-protected"
                            : doc.status === "Restricted"
                              ? "security-restricted"
                              : "security-review"
                        }`}
                      >
                        <span className="document-security-dot" />
                        {doc.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="documents-row-action"
                        onClick={() => viewDocumentDetails(doc)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="documents-empty-state">
                        <span aria-hidden="true">⌕</span>
                        <strong>No documents found</strong>
                        <p>
                          Try another search term or clear the selected filters.
                        </p>
                        <button
                          type="button"
                          className="documents-row-action"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="documents-demo-footnote">
            <span aria-hidden="true">ⓘ</span>
            Current document entries are demonstration data and browser-session
            state. Security labels are illustrative and do not confirm that
            backend permissions have been enforced.
          </p>
        </section>

        <section className="documents-activity-panel">
          <div className="documents-section-heading">
            <div>
              <h2>Recent file activity</h2>
              <p>Review the files selected or rejected during this visit.</p>
            </div>
            <span className="documents-activity-count">
              {uploadActivity.length} / 10
            </span>
          </div>

          {uploadActivity.length === 0 ? (
            <div className="documents-activity-empty">
              <span
                className="documents-activity-empty-icon"
                aria-hidden="true"
              >
                ↗
              </span>
              <div>
                <strong>No recent file activity</strong>
                <p>When you select a file, its result will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="documents-activity-list">
              {uploadActivity.map((activity) => (
                <article
                  className="documents-activity-item"
                  key={activity.id}
                >
                  <span
                    className={`documents-activity-file-icon ${
                      activity.status === "Success"
                        ? "activity-file-success"
                        : "activity-file-rejected"
                    }`}
                    aria-hidden="true"
                  >
                    {activity.status === "Success" ? "✓" : "!"}
                  </span>

                  <div className="documents-activity-details">
                    <strong>{activity.name}</strong>
                    <span className="documents-activity-detail">
                      {formatFileSize(activity.size)} · {activity.time}
                    </span>
                    <p>{activity.message}</p>
                  </div>

                  <span
                    className={`documents-activity-status ${
                      activity.status === "Rejected"
                        ? "activity-rejected"
                        : "activity-ready"
                    }`}
                  >
                    <span />
                    {activity.status === "Success" ? "Selected" : "Rejected"}
                  </span>

                  <button
                    type="button"
                    className="documents-remove-activity"
                    onClick={() => removeActivity(activity.id)}
                    aria-label={`Remove activity for ${activity.name}`}
                    title="Remove activity"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="documents-footer">
          <span>© 2026 TrustVault</span>
          <span className="documents-footer-security">
            <span aria-hidden="true">♢</span> Secure document workspace
          </span>
        </footer>
      </main>
    </div>
  );
}