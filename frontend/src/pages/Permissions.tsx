
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Permissions.css";

type Theme = "light" | "dark";
type PermissionRole = "Viewer" | "Editor" | "Admin";
type PermissionStatus = "Active" | "Expiring soon" | "Revoked" | "Expired";

type PermissionRecord = {
  id: number;
  document: string;
  category: string;
  user: string;
  email: string;
  role: PermissionRole;
  grantedBy: string;
  grantedDate: string;
  expiryDate: string;
  status: PermissionStatus;
};

const initialPermissions: PermissionRecord[] = [
  {
    id: 1,
    document: "Client Contract.pdf",
    category: "Contracts",
    user: "Ravi Kumar",
    email: "ravi@example.com",
    role: "Viewer",
    grantedBy: "Hari",
    grantedDate: "20 Oct 2026",
    expiryDate: "30 Oct 2026",
    status: "Active",
  },
  {
    id: 2,
    document: "Security Policy.pdf",
    category: "Policies",
    user: "Priya Sharma",
    email: "priya@example.com",
    role: "Editor",
    grantedBy: "Hari",
    grantedDate: "19 Oct 2026",
    expiryDate: "25 Oct 2026",
    status: "Expiring soon",
  },
  {
    id: 3,
    document: "Project Proposal.docx",
    category: "Other",
    user: "Sita Reddy",
    email: "sita@example.com",
    role: "Viewer",
    grantedBy: "Hari",
    grantedDate: "18 Oct 2026",
    expiryDate: "Access revoked",
    status: "Revoked",
  },
  {
    id: 4,
    document: "Financial Report.pdf",
    category: "Finance",
    user: "Arjun Rao",
    email: "arjun@example.com",
    role: "Viewer",
    grantedBy: "Hari",
    grantedDate: "15 Oct 2026",
    expiryDate: "20 Oct 2026",
    status: "Expired",
  },
];

const documents = [
  { name: "Client Contract.pdf", category: "Contracts" },
  { name: "Security Policy.pdf", category: "Policies" },
  { name: "Project Proposal.docx", category: "Other" },
  { name: "Financial Report.pdf", category: "Finance" },
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

function getTodayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Permissions() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [permissions, setPermissions] =
    useState<PermissionRecord[]>(initialPermissions);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const [notice, setNotice] = useState("");
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionRecord | null>(null);

  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantDocument, setGrantDocument] = useState("");
  const [grantUser, setGrantUser] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] =
    useState<PermissionRole>("Viewer");
  const [grantExpiry, setGrantExpiry] = useState("");

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    try {
      localStorage.setItem("trustvault-theme", nextTheme);
    } catch {
      // Theme still changes for the current page session.
    }
  }

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissions.filter((item) => {
      const matchesSearch = [
        item.document,
        item.user,
        item.email,
        item.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === "All statuses" ||
        item.status === statusFilter;

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
  }, [
    permissions,
    search,
    statusFilter,
    roleFilter,
    categoryFilter,
  ]);

  const activeCount = permissions.filter(
    (item) => item.status === "Active",
  ).length;

  const expiringCount = permissions.filter(
    (item) => item.status === "Expiring soon",
  ).length;

  const revokedCount = permissions.filter(
    (item) => item.status === "Revoked",
  ).length;

  const expiredCount = permissions.filter(
    (item) => item.status === "Expired",
  ).length;

  function clearFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setRoleFilter("All roles");
    setCategoryFilter("All categories");
  }

  function openGrantForm() {
    setGrantDocument("");
    setGrantUser("");
    setGrantEmail("");
    setGrantRole("Viewer");
    setGrantExpiry("");
    setNotice("");
    setShowGrantForm(true);
  }

  function closeGrantForm() {
    setShowGrantForm(false);
  }

  function handleGrantPermission(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanUser = grantUser.trim();
    const cleanEmail = grantEmail.trim().toLowerCase();

    if (!grantDocument || !cleanUser || !cleanEmail) {
      setNotice("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNotice("Please enter a valid email address.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (grantExpiry && grantExpiry < today) {
      setNotice("Expiry date cannot be in the past.");
      return;
    }

    const selectedDocument = documents.find(
      (item) => item.name === grantDocument,
    );

    if (!selectedDocument) {
      setNotice("Please select a valid document.");
      return;
    }

    const duplicate = permissions.some(
      (item) =>
        item.document === grantDocument &&
        item.email.toLowerCase() === cleanEmail &&
        item.status !== "Revoked" &&
        item.status !== "Expired",
    );

    if (duplicate) {
      setNotice(
        "This user already has an active permission for this document.",
      );
      return;
    }

    const expiryDate = grantExpiry
      ? new Date(`${grantExpiry}T12:00:00`).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        )
      : "No expiry";

    const newPermission: PermissionRecord = {
      id: Date.now(),
      document: selectedDocument.name,
      category: selectedDocument.category,
      user: cleanUser,
      email: cleanEmail,
      role: grantRole,
      grantedBy: "Hari",
      grantedDate: getTodayLabel(),
      expiryDate,
      status: "Active",
    };

    setPermissions((current) => [newPermission, ...current]);
    setShowGrantForm(false);
    clearFilters();

    setNotice(
      `Demo permission added for ${cleanUser} on ${selectedDocument.name}. Backend access has not changed.`,
    );
  }

  function revokePermission(item: PermissionRecord) {
    if (item.status === "Revoked" || item.status === "Expired") {
      return;
    }

    setPermissions((current) =>
      current.map((permission) =>
        permission.id === item.id
          ? {
              ...permission,
              status: "Revoked",
              expiryDate: "Access revoked",
            }
          : permission,
      ),
    );

    setSelectedPermission(null);
    setNotice(
      `Demo permission marked as revoked for ${item.user}. The backend has not been updated.`,
    );
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
          <Link
            to="/dashboard"
            className="permissions-dashboard-link"
          >
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
            aria-label="Open Hari's profile"
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
              Review who can access each document and monitor permission
              status across your workspace.
            </p>
          </div>

          <button
            type="button"
            className="permissions-primary-button"
            onClick={openGrantForm}
          >
            + Grant Permission
          </button>
        </section>

        <section className="permissions-notice">
          <span aria-hidden="true">🛡️</span>
          <p>
            <strong>Least-privilege access:</strong> Grant users only the
            access they need. Revoked and expired permissions must be denied
            by the server, not just hidden in the interface.
          </p>
        </section>

        {notice && (
          <section className="permissions-feedback" role="status">
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

        <section className="permissions-stats">
          <article className="permissions-stat-card">
            <span className="permissions-stat-icon">🔑</span>
            <div>
              <p>Total Grants</p>
              <h2>{permissions.length}</h2>
            </div>
          </article>

          <article className="permissions-stat-card">
            <span className="permissions-stat-icon stat-success">✓</span>
            <div>
              <p>Active Access</p>
              <h2>{activeCount}</h2>
            </div>
          </article>

          <article className="permissions-stat-card">
            <span className="permissions-stat-icon stat-warning">◷</span>
            <div>
              <p>Expiring Soon</p>
              <h2>{expiringCount}</h2>
            </div>
          </article>

          <article className="permissions-stat-card">
            <span className="permissions-stat-icon stat-danger">⊘</span>
            <div>
              <p>Revoked Access</p>
              <h2>{revokedCount}</h2>
            </div>
          </article>
        </section>

        <section className="permissions-panel">
          <div className="permissions-panel-heading">
            <div>
              <h2>User &amp; Document Access</h2>
              <p>
                Inspect permission grants, roles, expiry dates, and statuses.
              </p>
            </div>

            <span className="permissions-count">
              {filteredPermissions.length} records
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
                placeholder="Search user, email, or document..."
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
              <option>Expiring soon</option>
              <option>Revoked</option>
              <option>Expired</option>
            </select>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option>All roles</option>
              <option>Viewer</option>
              <option>Editor</option>
              <option>Admin</option>
            </select>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option>All categories</option>
              <option>Contracts</option>
              <option>Policies</option>
              <option>Other</option>
              <option>Finance</option>
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
                  <th>DOCUMENT / USER</th>
                  <th>ROLE</th>
                  <th>GRANTED BY</th>
                  <th>GRANTED DATE</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredPermissions.length > 0 ? (
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
                            <span>{item.user}</span>
                            <small>{item.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`permissions-role role-${item.role.toLowerCase()}`}
                        >
                          {item.role}
                        </span>
                      </td>

                      <td>{item.grantedBy}</td>
                      <td>{item.grantedDate}</td>
                      <td>{item.expiryDate}</td>

                      <td>
                        <span
                          className={`permissions-status status-${item.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {item.status}
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

                          {item.status !== "Revoked" &&
                            item.status !== "Expired" && (
                              <button
                                type="button"
                                className="permissions-revoke-button"
                                onClick={() => revokePermission(item)}
                              >
                                Revoke
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="permissions-empty" colSpan={7}>
                      <strong>No matching permissions found</strong>
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

          <p className="permissions-footnote">
            Demo records only. Grant and revoke actions currently update
            frontend state only. Real access must be enforced by the backend.
          </p>
        </section>

        <section className="permissions-expiry-note">
          <span aria-hidden="true">ℹ️</span>
          <div>
            <strong>Expired permission records: {expiredCount}</strong>
            <p>
              Expired grants should no longer authorize document access.
              Preserve their history for auditing rather than deleting records.
            </p>
          </div>
        </section>

        <footer className="permissions-footer">
          <span>TrustVault · Permission management</span>
          <span>Secure access begins with least privilege.</span>
        </footer>
      </main>

      {/* Grant Permission Modal */}
      {showGrantForm && (
        <div
          className="permissions-modal-backdrop"
          onClick={closeGrantForm}
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
                onClick={closeGrantForm}
                aria-label="Close grant permission form"
              >
                ×
              </button>
            </div>

            <p className="grant-permission-description">
              Select a document, identify the user, and choose the access role.
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
                >
                  <option value="" disabled>
                    Select a document
                  </option>

                  {documents.map((document) => (
                    <option key={document.name} value={document.name}>
                      {document.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grant-form-field">
                <label htmlFor="grant-user-name">User name</label>
                <input
                  id="grant-user-name"
                  type="text"
                  value={grantUser}
                  onChange={(event) => setGrantUser(event.target.value)}
                  placeholder="Enter user's full name"
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="grant-form-field">
                <label htmlFor="grant-user-email">User email</label>
                <input
                  id="grant-user-email"
                  type="email"
                  value={grantEmail}
                  onChange={(event) => setGrantEmail(event.target.value)}
                  placeholder="user@example.com"
                  maxLength={254}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grant-form-field">
                <label htmlFor="grant-role">Access role</label>
                <select
                  id="grant-role"
                  value={grantRole}
                  onChange={(event) =>
                    setGrantRole(event.target.value as PermissionRole)
                  }
                  required
                >
                  <option value="Viewer">Viewer — view document</option>
                  <option value="Editor">Editor — edit document</option>
                  <option value="Admin">Admin — manage access</option>
                </select>
              </div>

              <div className="grant-form-field grant-form-full">
                <label htmlFor="grant-expiry">Expiry date (optional)</label>
                <input
                  id="grant-expiry"
                  type="date"
                  value={grantExpiry}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setGrantExpiry(event.target.value)}
                />
                <small>
                  Demo form only. The backend must verify user identity and
                  enforce document permissions.
                </small>
              </div>

              <div className="grant-form-warning">
                <strong>Demo only:</strong> this adds a sample record to the
                current page state. It does not grant real file access.
              </div>

              <div className="grant-form-actions">
                <button
                  type="button"
                  className="permissions-reset-button"
                  onClick={closeGrantForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="permissions-primary-button"
                >
                  Add demo permission
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Permission Details Modal */}
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
                <dt>Category</dt>
                <dd>{selectedPermission.category}</dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>{selectedPermission.user}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedPermission.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{selectedPermission.role}</dd>
              </div>
              <div>
                <dt>Granted by</dt>
                <dd>{selectedPermission.grantedBy}</dd>
              </div>
              <div>
                <dt>Granted date</dt>
                <dd>{selectedPermission.grantedDate}</dd>
              </div>
              <div>
                <dt>Expiry date</dt>
                <dd>{selectedPermission.expiryDate}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedPermission.status}</dd>
              </div>
            </dl>

            <p className="permissions-modal-note">
              This is a sample record. Changes are held in frontend state
              only and are not proof of real access control.
            </p>

            <div className="permissions-modal-actions">
              <button
                type="button"
                className="permissions-reset-button"
                onClick={() => setSelectedPermission(null)}
              >
                Close
              </button>

              {selectedPermission.status !== "Revoked" &&
                selectedPermission.status !== "Expired" && (
                  <button
                    type="button"
                    className="permissions-primary-button permissions-modal-done"
                    onClick={() => revokePermission(selectedPermission)}
                  >
                    Revoke access
                  </button>
                )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
