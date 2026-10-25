
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import "./Permissions.css";

type Theme = "light" | "dark";
type PermissionType = "READ" | "WRITE" | "READ_WRITE";
type PermissionRole = "Viewer" | "Write only" | "Editor";

interface ApiDocument {
  id: number;
  fileName: string;
  uploadedAt: string;
  status: string;
}

interface ApiPermission {
  documentId: number;
  fileName: string;
  recipientId: number;
  recipientEmail: string;
  permissionType: PermissionType;
  grantedAt: string;
}

interface DocumentsResponse {
  count: number;
  documents: ApiDocument[];
}

interface PermissionsResponse {
  count: number;
  permissions: ApiPermission[];
}

interface PermissionRecord {
  id: string;
  documentId: number;
  recipientId: number;
  document: string;
  category: string;
  email: string;
  role: PermissionRole;
  permissionType: PermissionType;
  grantedDate: string;
  status: "Active";
}

function getInitialTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleFromPermission(type: PermissionType): PermissionRole {
  switch (type) {
    case "READ":
      return "Viewer";
    case "WRITE":
      return "Write only";
    case "READ_WRITE":
      return "Editor";
  }
}

function permissionLabel(type: PermissionType): string {
  switch (type) {
    case "READ":
      return "Viewer — read only";
    case "WRITE":
      return "Write only";
    case "READ_WRITE":
      return "Editor — read and write";
  }
}

function categoryFromFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "PDF";
  if (["doc", "docx"].includes(extension ?? "")) return "Word";
  if (["xls", "xlsx", "csv"].includes(extension ?? "")) return "Spreadsheets";
  if (["txt", "md"].includes(extension ?? "")) return "Text";

  return "Other";
}

function mapPermission(item: ApiPermission): PermissionRecord {
  return {
    id: `${item.documentId}-${item.recipientId}`,
    documentId: item.documentId,
    recipientId: item.recipientId,
    document: item.fileName,
    category: categoryFromFileName(item.fileName),
    email: item.recipientEmail,
    role: roleFromPermission(item.permissionType),
    permissionType: item.permissionType,
    grantedDate: formatDate(item.grantedAt),
    status: "Active",
  };
}

export default function Permissions() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const [selectedPermission, setSelectedPermission] =
    useState<PermissionRecord | null>(null);

  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantDocument, setGrantDocument] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] =
    useState<PermissionRole>("Viewer");

  const [grantError, setGrantError] = useState("");

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    try {
      localStorage.setItem("trustvault-theme", nextTheme);
    } catch {
      // Theme remains active for this page session.
    }
  };

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setLoadError("");

    try {
      const [documentResponse, permissionResponse] = await Promise.all([
        apiRequest<DocumentsResponse>("/api/documents"),
        apiRequest<PermissionsResponse>("/api/documents/permissions/owned"),
      ]);

      setDocuments(documentResponse.documents ?? []);
      setPermissions(
        (permissionResponse.permissions ?? []).map(mapPermission),
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load permissions from the backend.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categories = useMemo(
    () => [...new Set(permissions.map((item) => item.category))].sort(),
    [permissions],
  );

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissions.filter((item) => {
      const matchesSearch = [
        item.document,
        item.email,
        item.category,
        item.permissionType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === "All statuses" || item.status === statusFilter;

      const matchesRole =
        roleFilter === "All roles" || item.role === roleFilter;

      const matchesCategory =
        categoryFilter === "All categories" ||
        item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRole &&
        matchesCategory
      );
    });
  }, [permissions, search, statusFilter, roleFilter, categoryFilter]);

  const uniqueRecipients = useMemo(
    () => new Set(permissions.map((item) => item.recipientId)).size,
    [permissions],
  );

  const uniqueDocuments = useMemo(
    () => new Set(permissions.map((item) => item.documentId)).size,
    [permissions],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setRoleFilter("All roles");
    setCategoryFilter("All categories");
  }

  function showMessage(message: string, type: "success" | "error") {
    setNotice(message);
    setNoticeType(type);
  }

  function openGrantForm() {
    setGrantDocument("");
    setGrantEmail("");
    setGrantRole("Viewer");
    setGrantError("");
    setNotice("");
    setShowGrantForm(true);
  }

  async function handleGrantPermission(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (submitting) return;

    const documentId = Number(grantDocument);
    const recipientEmail = grantEmail.trim().toLowerCase();

    if (!Number.isSafeInteger(documentId) || documentId <= 0) {
      setGrantError("Please select a valid document.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setGrantError("Please enter a valid recipient email address.");
      return;
    }

    const permissionType: PermissionType =
      grantRole === "Viewer"
        ? "READ"
        : grantRole === "Write only"
          ? "WRITE"
          : "READ_WRITE";

    setSubmitting(true);
    setGrantError("");

    try {
      await apiRequest<{ message: string }>(
        `/api/documents/${documentId}/permissions`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail,
            permissionType,
          }),
        },
      );

      setShowGrantForm(false);
      setGrantDocument("");
      setGrantEmail("");
      clearFilters();

      showMessage(
        `Permission saved for ${recipientEmail}.`,
        "success",
      );

      await loadData(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to grant permission.";

      setGrantError(message);
      showMessage(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function revokePermission(item: PermissionRecord) {
    if (revokingId) return;

    const confirmed = window.confirm(
      `Revoke ${item.permissionType} access for ${item.email} to "${item.document}"?`,
    );

    if (!confirmed) return;

    setRevokingId(item.id);
    setNotice("");

    try {
      await apiRequest<void>(
        `/api/documents/${item.documentId}/permissions/${item.recipientId}`,
        { method: "DELETE" },
      );

      setSelectedPermission(null);

      showMessage(
        `Access revoked for ${item.email}.`,
        "success",
      );

      await loadData(false);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to revoke permission.",
        "error",
      );
    } finally {
      setRevokingId(null);
    }
  }

  function openDetails(item: PermissionRecord) {
    setSelectedPermission(item);
    setNotice("");
  }

  return (
    <div
      className={`permissions-page ${
        theme === "dark" ? "theme-dark" : ""
      }`}
    >
      <header className="permissions-topbar">
        <Link
          className="permissions-brand"
          to="/dashboard"
          aria-label="TrustVault dashboard"
        >
          <span className="permissions-brand-icon">🔐</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE DOCUMENT WORKSPACE</small>
          </span>
        </Link>

        <div className="permissions-topbar-right">
          <Link to="/dashboard" className="permissions-dashboard-link">
            <span aria-hidden="true">⌂</span>
            Dashboard
          </Link>

          <button
            type="button"
            className="permissions-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          <Link
            to="/profile"
            className="permissions-avatar-link"
            aria-label="Open profile"
            title="My Profile"
          >
            H
          </Link>
        </div>
      </header>

      <main className="permissions-content">
        <section className="permissions-heading">
          <div>
            <p className="permissions-eyebrow">
              SECURITY &amp; GOVERNANCE
            </p>
            <h1>Permissions</h1>
            <p className="permissions-subtitle">
              Review who can access each document and manage permissions
              enforced by your backend.
            </p>
          </div>

          <button
            type="button"
            className="permissions-primary-button"
            onClick={openGrantForm}
            disabled={loading || documents.length === 0}
            title={
              documents.length === 0
                ? "Upload a document before granting access."
                : "Grant document access"
            }
          >
            + Grant Permission
          </button>
        </section>

        <section className="permissions-notice">
          <span aria-hidden="true">🛡️</span>
          <p>
            <strong>Least-privilege access:</strong> Grant only the access
            a recipient needs. The backend must enforce every grant and
            revocation.
          </p>
        </section>

        {notice && (
          <section
            className="permissions-feedback"
            role={noticeType === "error" ? "alert" : "status"}
          >
            <p>{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </section>
        )}

        {loadError && (
          <section className="permissions-feedback" role="alert">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadData()}
            >
              Retry
            </button>
          </section>
        )}

        <section className="permissions-stats">
          <article className="permissions-stat-card">
            <span className="permissions-stat-icon">🔑</span>
            <div>
              <p>Total Grants</p>
              <h2>{loading ? "—" : permissions.length}</h2>
            </div>
          </article>

          <article className="permissions-stat-card">
            <span className="permissions-stat-icon stat-success">✓</span>
            <div>
              <p>Active Grants</p>
              <h2>{loading ? "—" : permissions.length}</h2>
            </div>
          </article>

          <article className="permissions-stat-card">
            <span className="permissions-stat-icon">👥</span>
            <div>
              <p>Unique Recipients</p>
              <h2>{loading ? "—" : uniqueRecipients}</h2>
            </div>
          </article>

          <article className="permissions-stat-card">
            <span className="permissions-stat-icon">📄</span>
            <div>
              <p>Documents Shared</p>
              <h2>{loading ? "—" : uniqueDocuments}</h2>
            </div>
          </article>
        </section>

        <section className="permissions-panel">
          <div className="permissions-panel-heading">
            <div>
              <h2>User &amp; Document Access</h2>
              <p>Review grants currently returned by the backend.</p>
            </div>

            <span className="permissions-count">
              {loading ? "Loading…" : `${filteredPermissions.length} records`}
            </span>
          </div>

          <div className="permissions-filters">
            <label className="permissions-search">
              <span aria-hidden="true">⌕</span>
              <span className="permissions-visually-hidden">
                Search permissions
              </span>
              <input
                type="search"
                placeholder="Search email or document..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option>All statuses</option>
              <option>Active</option>
            </select>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option>All roles</option>
              <option>Viewer</option>
              <option>Write only</option>
              <option>Editor</option>
            </select>

            <select
              aria-label="Filter by file category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option>All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <button
              type="button"
              className="permissions-clear-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>

          <div className="permissions-table-wrap">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>DOCUMENT / RECIPIENT</th>
                  <th>ROLE</th>
                  <th>GRANTED BY</th>
                  <th>GRANTED DATE</th>
                  <th>PERMISSION</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="permissions-empty" colSpan={7}>
                      Loading permissions from the backend…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td className="permissions-empty" colSpan={7}>
                      Could not load permissions. Use Retry above.
                    </td>
                  </tr>
                ) : filteredPermissions.length > 0 ? (
                  filteredPermissions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="permissions-document-cell">
                          <span className="permissions-file-icon">
                            {item.document.toLowerCase().endsWith(".pdf")
                              ? "PDF"
                              : "DOC"}
                          </span>
                          <div>
                            <strong>{item.document}</strong>
                            <span>{item.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`permissions-role role-${item.role
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {item.role}
                        </span>
                      </td>

                      <td>Current owner</td>
                      <td>{item.grantedDate}</td>
                      <td>{item.permissionType}</td>

                      <td>
                        <span className="permissions-status status-active">
                          Active
                        </span>
                      </td>

                      <td>
                        <div className="permissions-row-actions">
                          <button
                            type="button"
                            onClick={() => openDetails(item)}
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            className="permissions-revoke-button"
                            disabled={revokingId !== null}
                            onClick={() => void revokePermission(item)}
                          >
                            {revokingId === item.id ? "Revoking…" : "Revoke"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="permissions-empty" colSpan={7}>
                      <strong>
                        {permissions.length === 0
                          ? "No permissions granted yet"
                          : "No matching permissions found"}
                      </strong>
                      <p>
                        {permissions.length === 0
                          ? "Grant access to a registered user to see it here."
                          : "Try changing your search or filters."}
                      </p>
                      {permissions.length > 0 && (
                        <button type="button" onClick={clearFilters}>
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="permissions-footnote">
            Data is loaded from the backend. This list shows current grants;
            revoked grants are not retained in this endpoint.
          </p>
        </section>

        <section className="permissions-expiry-note">
          <span aria-hidden="true">ℹ️</span>
          <div>
            <strong>Access status</strong>
            <p>
              The current API does not expose expiry dates or revoked
              permission history. Those counts are intentionally not shown.
              Successful revocations are recorded by the backend audit service.
            </p>
          </div>
        </section>

        <footer className="permissions-footer">
          <span>TrustVault · Permission management</span>
          <span>Secure access begins with least privilege.</span>
        </footer>
      </main>

      {showGrantForm && (
        <div
          className="permissions-modal-backdrop"
          onClick={() => !submitting && setShowGrantForm(false)}
        >
          <section
            className="permissions-modal grant-permission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="grant-permission-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="permissions-modal-heading">
              <div>
                <p className="permissions-eyebrow">ACCESS CONTROL</p>
                <h2 id="grant-permission-title">Grant Permission</h2>
              </div>

              <button
                type="button"
                className="permissions-modal-close"
                onClick={() => setShowGrantForm(false)}
                disabled={submitting}
                aria-label="Close grant permission form"
              >
                ×
              </button>
            </div>

            <p className="grant-permission-description">
              Choose one of your documents and enter the email of a registered
              TrustVault user.
            </p>

            <form
              className="grant-permission-form"
              onSubmit={handleGrantPermission}
            >
              <div className="grant-form-field">
                <label htmlFor="grant-document">Document</label>
                <select
                  id="grant-document"
                  value={grantDocument}
                  onChange={(event) => setGrantDocument(event.target.value)}
                  required
                  disabled={submitting}
                >
                  <option value="" disabled>
                    Select a document
                  </option>

                  {documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.fileName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grant-form-field">
                <label htmlFor="grant-user-email">Recipient email</label>
                <input
                  id="grant-user-email"
                  type="email"
                  value={grantEmail}
                  onChange={(event) => setGrantEmail(event.target.value)}
                  placeholder="user@example.com"
                  maxLength={254}
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grant-form-field">
                <label htmlFor="grant-role">Access permission</label>
                <select
                  id="grant-role"
                  value={grantRole}
                  onChange={(event) =>
                    setGrantRole(event.target.value as PermissionRole)
                  }
                  required
                  disabled={submitting}
                >
                  <option value="Viewer">Viewer — read only (READ)</option>
                  <option value="Write only">Write only (WRITE)</option>
                  <option value="Editor">
                    Editor — read and write (READ_WRITE)
                  </option>
                </select>
              </div>

              <div className="grant-form-warning">
                <strong>Security:</strong> the recipient must have a registered
                account. The server validates the owner and permission request.
              </div>

              {grantError && (
                <div className="permissions-feedback" role="alert">
                  <p>{grantError}</p>
                </div>
              )}

              <div className="grant-form-actions">
                <button
                  type="button"
                  className="permissions-reset-button"
                  onClick={() => setShowGrantForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="permissions-primary-button"
                  disabled={submitting || documents.length === 0}
                >
                  {submitting ? "Saving…" : "Grant access"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedPermission && (
        <div
          className="permissions-modal-backdrop"
          onClick={() => setSelectedPermission(null)}
        >
          <section
            className="permissions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="permissions-modal-heading">
              <div>
                <p className="permissions-eyebrow">ACCESS RECORD</p>
                <h2 id="permission-details-title">Permission details</h2>
              </div>

              <button
                type="button"
                className="permissions-modal-close"
                onClick={() => setSelectedPermission(null)}
                aria-label="Close permission details"
              >
                ×
              </button>
            </div>

            <dl className="permissions-details-list">
              <div>
                <dt>Document</dt>
                <dd>{selectedPermission.document}</dd>
              </div>
              <div>
                <dt>Document ID</dt>
                <dd>{selectedPermission.documentId}</dd>
              </div>
              <div>
                <dt>Recipient email</dt>
                <dd>{selectedPermission.email}</dd>
              </div>
              <div>
                <dt>Recipient ID</dt>
                <dd>{selectedPermission.recipientId}</dd>
              </div>
              <div>
                <dt>Access role</dt>
                <dd>{selectedPermission.role}</dd>
              </div>
              <div>
                <dt>Permission type</dt>
                <dd>{permissionLabel(selectedPermission.permissionType)}</dd>
              </div>
              <div>
                <dt>Granted date</dt>
                <dd>{selectedPermission.grantedDate}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Active — returned by backend</dd>
              </div>
            </dl>

            <p className="permissions-modal-note">
              Revoking this permission removes the current grant. The backend
              handles the authorization check and audit event.
            </p>

            <div className="permissions-modal-actions">
              <button
                type="button"
                className="permissions-reset-button"
                onClick={() => setSelectedPermission(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="permissions-primary-button permissions-modal-done"
                disabled={revokingId !== null}
                onClick={() => void revokePermission(selectedPermission)}
              >
                {revokingId === selectedPermission.id
                  ? "Revoking…"
                  : "Revoke access"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
