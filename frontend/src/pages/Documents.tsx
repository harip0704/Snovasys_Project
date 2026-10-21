import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Link } from "react-router-dom";
import "./Documents.css";

type DocumentItem = {
  id: number;
  name: string;
  category: string;
  owner: string;
  updated: string;
  access: "Protected" | "Restricted";
};

type Theme = "light" | "dark";

type UploadStatus = "Ready to upload" | "Rejected";

type UploadAttempt = {
  id: string;
  name: string;
  size: number;
  extension: string;
  status: UploadStatus;
  detail: string;
  addedAt: string;
};

const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    name: "Employment Agreement.pdf",
    category: "Legal",
    owner: "Admin",
    updated: "21 Oct 2026",
    access: "Protected",
  },
  {
    id: 2,
    name: "Client Contract.pdf",
    category: "Contracts",
    owner: "Priya",
    updated: "20 Oct 2026",
    access: "Protected",
  },
  {
    id: 3,
    name: "Salary Statement.pdf",
    category: "Finance",
    owner: "HR Team",
    updated: "19 Oct 2026",
    access: "Restricted",
  },
  {
    id: 4,
    name: "Security Policy.pdf",
    category: "Policies",
    owner: "Admin",
    updated: "18 Oct 2026",
    access: "Protected",
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RECENT_FILES = 5;

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

function getSavedTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return "FILE";
  }

  return fileName.slice(dotIndex + 1).toUpperCase();
}

export default function Documents() {
  const [documents] = useState<DocumentItem[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [uploadAttempts, setUploadAttempts] = useState<UploadAttempt[]>([]);
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("trustvault-theme", theme);
    } catch {
      // Theme still works if local storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const searchTerm = search.trim().toLowerCase();

      const matchesSearch =
        document.name.toLowerCase().includes(searchTerm) ||
        document.owner.toLowerCase().includes(searchTerm);

      const matchesCategory =
        category === "All" || document.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [documents, search, category]);

  function handleUpload() {
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
      extension: getFileExtension(file.name),
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

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();

    const isAllowed = ALLOWED_EXTENSIONS.some((extension) =>
      fileName.endsWith(extension),
    );

    if (!isAllowed) {
      const reason =
        "Unsupported file type. Please select a PDF, DOC, DOCX, or TXT file.";

      addUploadAttempt(file, "Rejected", reason);
      setMessage(reason);
      input.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const reason = "File is too large. Maximum allowed size is 10 MB.";

      addUploadAttempt(file, "Rejected", reason);
      setMessage(reason);
      input.value = "";
      return;
    }

    if (file.size === 0) {
      const reason = "The selected file is empty. Please choose another file.";

      addUploadAttempt(file, "Rejected", reason);
      setMessage(reason);
      input.value = "";
      return;
    }

    addUploadAttempt(
      file,
      "Ready to upload",
      "File passed basic browser validation. Secure backend upload is still pending.",
    );

    setMessage(
      "File is ready for review. It has not been uploaded to secure storage.",
    );

    // Allows selecting the same file again later.
    input.value = "";
  }

  function handleRemoveFile(id: string, fileName: string) {
    setUploadAttempts((current) =>
      current.filter((file) => file.id !== id),
    );

    setMessage(`${fileName} removed from the recent activity list.`);
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
              Manage confidential files and review their access status.
            </p>
          </div>

          <button
            className="documents-upload-btn"
            type="button"
            onClick={handleUpload}
          >
            <span aria-hidden="true">＋</span> Upload Document
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

        {message && (
          <div className="documents-message" role="status">
            <span aria-hidden="true">ⓘ</span>

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

        {/* Recent file activity */}
        <section
          className="documents-upload-activity"
          aria-labelledby="recent-uploads-title"
        >
          <div className="documents-upload-heading">
            <div>
              <h2 id="recent-uploads-title">Recent Uploads</h2>
              <p>
                Review selected files, validation results, and upload status.
              </p>
            </div>

            <span className="documents-upload-count">
              {uploadAttempts.length} / {MAX_RECENT_FILES}
            </span>
          </div>

          {uploadAttempts.length === 0 ? (
            <div className="documents-upload-empty">
              <span className="documents-upload-empty-icon" aria-hidden="true">
                ▤
              </span>

              <strong>No recent files</strong>

              <p>
                Select a document using Upload Document. Its details and
                validation status will appear here.
              </p>
            </div>
          ) : (
            <div className="documents-upload-list">
              {uploadAttempts.map((file) => (
                <article
                  className="documents-upload-card"
                  key={file.id}
                >
                  <div
                    className={`documents-upload-file-type ${
                      file.status === "Rejected"
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
                        file.status === "Rejected"
                          ? "upload-status-rejected"
                          : "upload-status-ready"
                      }`}
                    >
                      <span aria-hidden="true">
                        {file.status === "Rejected" ? "●" : "●"}
                      </span>

                      {file.status}
                    </span>

                    <p
                      className={`documents-upload-detail ${
                        file.status === "Rejected"
                          ? "upload-detail-rejected"
                          : ""
                      }`}
                    >
                      {file.detail}
                    </p>
                  </div>

                  <button
                    className="documents-upload-remove"
                    type="button"
                    onClick={() => handleRemoveFile(file.id, file.name)}
                    aria-label={`Remove ${file.name} from recent activity`}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}

          <p className="documents-upload-note">
            Recent activity is held in the current page session. Removing an
            item clears its entry from this list; it does not delete a file
            from your device or secure storage.
          </p>
        </section>

        <section
          className="documents-stats"
          aria-label="Document statistics"
        >
          <article className="document-stat-card">
            <span className="document-stat-icon" aria-hidden="true">
              ▤
            </span>

            <div>
              <p>Total Documents</p>
              <h2>{documents.length}</h2>
            </div>
          </article>

          <article className="document-stat-card">
            <span className="document-stat-icon" aria-hidden="true">
              🔒
            </span>

            <div>
              <p>Protected Files</p>
              <h2>
                {documents.filter((doc) => doc.access === "Protected").length}
              </h2>
            </div>
          </article>

          <article className="document-stat-card">
            <span className="document-stat-icon" aria-hidden="true">
              ◈
            </span>

            <div>
              <p>Categories</p>
              <h2>
                {new Set(documents.map((doc) => doc.category)).size}
              </h2>
            </div>
          </article>
        </section>

        <section className="documents-panel">
          <div className="documents-panel-heading">
            <div>
              <h2>All Documents</h2>
              <p>Search and filter your available files.</p>
            </div>

            <span className="documents-count">
              {filteredDocuments.length}{" "}
              {filteredDocuments.length === 1 ? "file" : "files"}
            </span>
          </div>

          <div className="documents-filters">
            <label className="documents-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder="Search by document or owner..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="documents-category">
              <span className="visually-hidden">Filter by category</span>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Legal">Legal</option>
                <option value="Contracts">Contracts</option>
                <option value="Finance">Finance</option>
                <option value="Policies">Policies</option>
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
                  <th>Security</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <div className="document-name-cell">
                        <span className="document-file-icon">PDF</span>
                        <span>{document.name}</span>
                      </div>
                    </td>

                    <td>{document.category}</td>
                    <td>{document.owner}</td>
                    <td>{document.updated}</td>

                    <td>
                      <span
                        className={`document-security ${
                          document.access === "Protected"
                            ? "security-protected"
                            : "security-restricted"
                        }`}
                      >
                        <span aria-hidden="true">●</span>
                        {document.access}
                      </span>
                    </td>

                    <td>
                      <button
                        className="document-action-btn"
                        type="button"
                        onClick={() =>
                          setMessage(
                            `${document.name}: viewing and permission controls will be connected to the secure backend next.`,
                          )
                        }
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

                      <strong>No documents found</strong>

                      <p>Try another search term or category.</p>

                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setCategory("All");
                        }}
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="documents-demo-note">
            Demo records only — secure access must be enforced by the backend.
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