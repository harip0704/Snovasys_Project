import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import "./Documents.css";

type Theme = "light" | "dark";
type UploadStatus = "Success" | "Rejected";

type DocumentItem = {
  id: string;
  name: string;
  category: string;
  owner: string;
  lastUpdated: string;
  status: string;
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

type DocumentsResponse = {
  count: number;
  documents: {
    id: number;
    fileName: string;
    uploadedAt: string;
    status: string;
  }[];
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

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

function getCurrentTime(): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function formatDate(date: string): string {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function Documents() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<Theme>(readSavedTheme);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");
  const [uploadActivity, setUploadActivity] = useState<UploadAttempt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await apiRequest<DocumentsResponse>("/api/documents");

      setDocuments(
        response.documents.map((document) => ({
          id: String(document.id),
          name: document.fileName,
          category: "—",
          owner: "You",
          lastUpdated: formatDate(document.uploadedAt),
          status: document.status,
        })),
      );
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const statusOptions = useMemo(
    () => [
      "All statuses",
      ...Array.from(new Set(documents.map((doc) => doc.status))).sort(),
    ],
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesSearch =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        doc.id.toLowerCase().includes(query) ||
        doc.status.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All statuses" || doc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [documents, searchTerm, statusFilter]);

  const activeCount = documents.filter(
    (doc) => doc.status.toUpperCase() === "ACTIVE",
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
      // The theme still changes for this page session.
    }
  }

  function addActivity(activity: UploadAttempt) {
    setUploadActivity((previous) => [activity, ...previous].slice(0, 10));
  }

  function validateFile(file: File): string {
    const extension = getFileExtension(file.name);

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return "Unsupported file type. Choose PDF, DOC, DOCX or TXT.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File exceeds the maximum allowed size of 10 MB.";
    }

    return "";
  }

  async function downloadDocument(doc: DocumentItem) {
    if (downloadingId !== null) return;

    setDownloadingId(doc.id);
    setMessage("");

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

      const response = await fetch(
        `${apiBaseUrl}/api/documents/${encodeURIComponent(doc.id)}/download`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        let errorMessage = `Download failed (${response.status})`;

        try {
          const data = await response.json();
          errorMessage =
            data.detail || data.message || data.error || errorMessage;
        } catch {
          // Keep the HTTP status message if the response isn't JSON.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = doc.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      showMessage(`Download started for ${doc.name}.`);
    } catch (error) {
      showMessage(
        `Unable to download ${doc.name}: ${getErrorMessage(error)}`,
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function uploadFile(file: File) {
    const validationError = validateFile(file);

    if (validationError) {
      addActivity({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "Rejected",
        message: validationError,
        time: getCurrentTime(),
        size: file.size,
      });

      showMessage(`${file.name}: ${validationError}`);
      return;
    }

    const duplicate = documents.some(
      (doc) => doc.name.toLowerCase() === file.name.toLowerCase(),
    );

    if (duplicate) {
      const duplicateMessage =
        "A document with this name already exists in your workspace.";

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

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiRequest<unknown>("/api/documents", {
        method: "POST",
        body: formData,
      });

      addActivity({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "Success",
        message: "Your file was accepted for upload.",
        time: getCurrentTime(),
        size: file.size,
      });

      showMessage(`${file.name} uploaded successfully.`);

      await loadDocuments();
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      addActivity({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "Rejected",
        message: `Upload failed: ${errorMessage}`,
        time: getCurrentTime(),
        size: file.size,
      });

      showMessage(`Upload failed for ${file.name}: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }

  async function processFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    for (const file of files) {
      await uploadFile(file);
    }

    setSearchTerm("");
    setStatusFilter("All statuses");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void processFiles(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void processFiles(event.dataTransfer.files);
  }

  function removeActivity(id: string) {
    setUploadActivity((previous) =>
      previous.filter((activity) => activity.id !== id),
    );
    showMessage("Activity item removed from this page.");
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All statuses");
    showMessage("Search and filters cleared.");
  }

  function statusClass(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized === "ACTIVE") return "security-protected";
    if (normalized === "RESTRICTED") return "security-restricted";
    return "security-review";
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
            disabled={uploading}
          >
            <span aria-hidden="true">＋</span>
            {uploading ? "Uploading..." : "Select a document"}
          </button>

          <input
            ref={fileInputRef}
            className="documents-hidden-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
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
                ▤
              </span>
              <span className="documents-summary-label">Total documents</span>
            </div>
            <strong className="documents-summary-number">
              {loading ? "…" : pageError ? "—" : documents.length}
            </strong>
            <span className="documents-summary-caption">
              {loading
                ? "Retrieving your documents"
                : "Available in your workspace"}
            </span>
          </article>

          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-green">
                ♙
              </span>
              <span className="documents-summary-label">Active</span>
            </div>
            <strong className="documents-summary-number">
              {loading || pageError ? "—" : activeCount}
            </strong>
            <span className="documents-summary-caption">Currently active</span>
          </article>

          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-blue">
                ◷
              </span>
              <span className="documents-summary-label">Other statuses</span>
            </div>
            <strong className="documents-summary-number">
              {loading || pageError ? "—" : documents.length - activeCount}
            </strong>
            <span className="documents-summary-caption">Not marked ACTIVE</span>
          </article>

          <article className="documents-summary-card">
            <div className="documents-summary-top">
              <span className="documents-summary-icon summary-icon-amber">
                !
              </span>
              <span className="documents-summary-label">Upload status</span>
            </div>
            <strong className="documents-summary-number">
              {uploading ? "…" : "—"}
            </strong>
            <span className="documents-summary-caption">
              {uploading ? "Upload in progress" : "No review workflow connected"}
            </span>
          </article>
        </section>

        <section className="documents-upload-panel">
          <div className="documents-section-heading">
            <div>
              <h2>Add documents</h2>
              <p>Upload files securely to TrustVault.</p>
            </div>
            <span className="documents-local-badge">
              <span /> Secure upload
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
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Browse files"}
            </button>
          </div>

          <div className="documents-security-note">
            <span aria-hidden="true">ⓘ</span>
            <p>
              <strong>Security note:</strong> Files are submitted securely for
              processing. Only treat an upload as successful after the server
              accepts it. Storage and access controls should be verified
              separately.
            </p>
          </div>
        </section>

        <section className="documents-list-panel">
          <div className="documents-section-heading documents-list-heading">
            <div>
              <h2>All documents</h2>
              <p>View and manage your documents.</p>
            </div>
            <span className="documents-result-count">
              {loading
                ? "Loading…"
                : `${filteredDocuments.length} ${
                    filteredDocuments.length === 1 ? "document" : "documents"
                  }`}
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
                placeholder="Search by name, status or ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search documents"
              />
            </label>

            <select
              className="documents-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="documents-clear-filters"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          {pageError && (
            <div className="documents-message" role="alert">
              <span>{pageError}</span>
              <button type="button" onClick={() => void loadDocuments()}>
                Retry
              </button>
            </div>
          )}

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
                {loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="documents-empty-state">
                        <strong>Loading documents…</strong>
                        <p>Getting your documents ready.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  !pageError &&
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className="documents-file-cell">
                          <span
                            className="documents-file-icon"
                            aria-hidden="true"
                          >
                            ▤
                          </span>
                          <span className="documents-file-info">
                            <strong>{doc.name}</strong>
                            <small>ID: {doc.id}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="documents-category">
                          {doc.category}
                        </span>
                      </td>

                      <td>
                        <span className="documents-owner">
                          <span className="documents-owner-avatar">Y</span>
                          {doc.owner}
                        </span>
                      </td>

                      <td className="documents-date">{doc.lastUpdated}</td>

                      <td>
                        <span
                          className={`document-security ${statusClass(doc.status)}`}
                        >
                          <span className="document-security-dot" />
                          {doc.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="documents-row-action"
                          onClick={() => void downloadDocument(doc)}
                          disabled={downloadingId !== null}
                          aria-label={`Download ${doc.name}`}
                        >
                          {downloadingId === doc.id
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  !pageError &&
                  filteredDocuments.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="documents-empty-state">
                          <span aria-hidden="true">⌕</span>
                          <strong>
                            {documents.length === 0
                              ? "No documents found"
                              : "No matching documents"}
                          </strong>
                          <p>
                            {documents.length === 0
                              ? "Upload a file to add a document to your workspace."
                              : "Try another search term or clear the filters."}
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
            Document details shown here reflect the information currently
            available. Category, file size, sharing details, and access
            permissions are not provided by the current document-list response.
          </p>
        </section>

        <section className="documents-activity-panel">
          <div className="documents-section-heading">
            <div>
              <h2>Recent file activity</h2>
              <p>Upload attempts made during this page session.</p>
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
                <p>Upload attempts will appear here.</p>
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
                    {activity.status === "Success" ? "Uploaded" : "Failed"}
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


