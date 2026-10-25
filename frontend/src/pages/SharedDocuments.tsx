
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";
import "./SharedDocuments.css";

type PermissionType = "READ" | "WRITE" | "READ_WRITE";
type Tab = "withMe" | "byMe";

type OwnedDocument = {
  id: number;
  fileName: string;
};

type SharedWithMe = {
  id: number;
  fileName: string;
  ownerEmail: string;
  permissionType: PermissionType;
  grantedAt?: string;
};

type OwnedPermission = {
  documentId: number;
  fileName: string;
  recipientId: number;
  recipientEmail: string;
  permissionType: PermissionType;
  grantedAt?: string;
};

type ListResponse<T> = {
  count?: number;
  documents?: T[];
  permissions?: T[];
};

const permissionLabels: Record<PermissionType, string> = {
  READ: "Viewer — read only",
  WRITE: "Write only",
  READ_WRITE: "Editor — read and write",
};

function dateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function listFrom<T>(
  response: ListResponse<T>,
  key: "documents" | "permissions",
): T[] {
  const list = response?.[key];
  return Array.isArray(list) ? list : [];
}

export default function SharedDocuments() {
  const [tab, setTab] = useState<Tab>("withMe");
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMe[]>([]);
  const [sharedByMe, setSharedByMe] = useState<OwnedPermission[]>([]);
  const [ownedDocuments, setOwnedDocuments] = useState<OwnedDocument[]>([]);

  const [selectedDocument, setSelectedDocument] = useState("");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<PermissionType>("READ");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("trustvault-theme") === "dark",
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [sharedResult, permissionsResult, documentsResult] =
        await Promise.all([
          apiRequest<ListResponse<SharedWithMe>>("/api/documents/shared"),
          apiRequest<ListResponse<OwnedPermission>>(
            "/api/documents/permissions/owned",
          ),
          apiRequest<ListResponse<OwnedDocument>>("/api/documents"),
        ]);

      setSharedWithMe(listFrom(sharedResult, "documents"));
      setSharedByMe(listFrom(permissionsResult, "permissions"));
      setOwnedDocuments(listFrom(documentsResult, "documents"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load shared documents.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem("trustvault-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const filteredSharedWithMe = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sharedWithMe.filter((item) =>
      `${item.fileName} ${item.ownerEmail} ${item.permissionType}`
        .toLowerCase()
        .includes(q),
    );
  }, [sharedWithMe, search]);

  const filteredSharedByMe = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sharedByMe.filter((item) =>
      `${item.fileName} ${item.recipientEmail} ${item.permissionType}`
        .toLowerCase()
        .includes(q),
    );
  }, [sharedByMe, search]);

  async function handleShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const documentId = Number(selectedDocument);
    if (!documentId || !email.trim()) {
      setError("Select a document and enter the recipient's email.");
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/api/documents/${documentId}/permissions`, {
        method: "POST",
        body: JSON.stringify({
          recipientEmail: email.trim(),
          permissionType: permission,
        }),
      });

      setMessage("Permission granted successfully.");
      setEmail("");
      setSelectedDocument("");
      setPermission("READ");
      setTab("byMe");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to share document.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(item: OwnedPermission) {
    const confirmed = window.confirm(
      `Revoke ${item.permissionType} access to "${item.fileName}" for ${item.recipientEmail}?`,
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    setBusyId(item.documentId);

    try {
      await apiRequest(
        `/api/documents/${item.documentId}/permissions/${item.recipientId}`,
        { method: "DELETE" },
      );

      setMessage(`Access revoked for ${item.recipientEmail}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke access.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownload(documentId: number, fileName: string) {
    setError("");
    setMessage("");

    try {
      const blob = await apiRequest<Blob>(
        `/api/documents/${documentId}/download`,
        {},
        "blob",
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(`Download started: ${fileName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    }
  }

  return (
    <div className={`shared-page ${darkMode ? "dark-mode" : ""}`}>
      <header className="shared-header">
        <div className="shared-header-left">
          <div className="shared-logo">TV</div>
          <div>
            <h1>TrustVault</h1>
            <p>Secure Document Sharing</p>
          </div>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setDarkMode((value) => !value)}
        >
          {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </header>

      <main className="shared-main">
        <section className="shared-page-heading">
          <div>
            <h2>Shared Documents</h2>
            <p>Manage document access using the secure backend.</p>
          </div>
          <div className="shared-summary">
            <div className="summary-card">
              <span>Shared with me</span>
              <strong>{sharedWithMe.length}</strong>
            </div>
            <div className="summary-card">
              <span>Shared by me</span>
              <strong>{sharedByMe.length}</strong>
            </div>
          </div>
        </section>

        {error && (
          <div className="shared-alert error-alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>×</button>
          </div>
        )}
        {message && (
          <div className="shared-alert success-alert" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <section className="share-form-card">
          <div className="section-heading">
            <div>
              <h3>Share a Document</h3>
              <p>Choose a document you own and grant access to a registered user.</p>
            </div>
          </div>

          <form onSubmit={handleShare}>
            <div className="share-form-grid">
              <div className="form-field">
                <label htmlFor="documentId">Document</label>
                <select
                  id="documentId"
                  value={selectedDocument}
                  onChange={(event) => setSelectedDocument(event.target.value)}
                  required
                >
                  <option value="">Select your document</option>
                  {ownedDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.fileName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="recipientEmail">Recipient email</label>
                <input
                  id="recipientEmail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="registered-user@example.com"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="permission">Permission</label>
                <select
                  id="permission"
                  value={permission}
                  onChange={(event) =>
                    setPermission(event.target.value as PermissionType)
                  }
                >
                  <option value="READ">Viewer — read only</option>
                  <option value="WRITE">Write only</option>
                  <option value="READ_WRITE">Editor — read and write</option>
                </select>
              </div>

              <div className="form-field form-submit-field">
                <label aria-hidden="true">&nbsp;</label>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Sharing..." : "+ Share Document"}
                </button>
              </div>
            </div>
          </form>

          {ownedDocuments.length === 0 && !loading && (
            <p className="permission-help">
              No owned documents are available to share. Upload a document first.
            </p>
          )}
        </section>

        <section className="shared-list-card">
          <div className="section-heading shared-list-heading">
            <div>
              <h3>Document Access</h3>
              <p>Current permissions returned by the backend.</p>
            </div>
            <div className="shared-tabs">
              <button
                type="button"
                className={tab === "withMe" ? "active" : ""}
                onClick={() => setTab("withMe")}
              >
                Shared with Me
              </button>
              <button
                type="button"
                className={tab === "byMe" ? "active" : ""}
                onClick={() => setTab("byMe")}
              >
                Shared by Me
              </button>
            </div>
          </div>

          <div className="shared-toolbar">
            <div className="shared-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search document, owner, or recipient..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadData()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="shared-table-wrapper">
            <table className="shared-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>{tab === "withMe" ? "Owner" : "Shared with"}</th>
                  <th>Permission</th>
                  <th>Date shared</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">Loading records...</td></tr>
                ) : tab === "withMe" ? (
                  filteredSharedWithMe.length ? filteredSharedWithMe.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fileName}</td>
                      <td>{item.ownerEmail}</td>
                      <td>{permissionLabels[item.permissionType] ?? item.permissionType}</td>
                      <td>{dateLabel(item.grantedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={item.permissionType === "WRITE"}
                          onClick={() => void handleDownload(item.id, item.fileName)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="empty-state">
                      No documents have been shared with your account.
                    </td></tr>
                  )
                ) : (
                  filteredSharedByMe.length ? filteredSharedByMe.map((item) => (
                    <tr key={`${item.documentId}-${item.recipientId}`}>
                      <td>{item.fileName}</td>
                      <td>{item.recipientEmail}</td>
                      <td>{permissionLabels[item.permissionType] ?? item.permissionType}</td>
                      <td>{dateLabel(item.grantedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={busyId === item.documentId}
                          onClick={() => void handleRevoke(item)}
                        >
                          {busyId === item.documentId ? "Revoking..." : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="empty-state">
                      You have not shared any documents yet.
                    </td></tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="shared-footer">
          TrustVault · Secure document access management
        </p>
      </main>
    </div>
  );
}
