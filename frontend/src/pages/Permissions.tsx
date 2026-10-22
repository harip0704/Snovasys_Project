
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

function getInitialTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function Permissions() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [permissions] = useState<PermissionRecord[]>(initialPermissions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [notice, setNotice] = useState("");
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionRecord | null>(null);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    try {
      localStorage.setItem("trustvault-theme", nextTheme);
    } catch {
      // The current page theme still changes if storage is unavailable.
    }
  }

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissions.filter((item) => {
      const matchesSearch =
        item.document.toLowerCase().includes(query) ||
        item.user.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All statuses" || item.status === statusFilter;

      const matchesRole =
        roleFilter === "All roles" || item.role === roleFilter;

      const matchesCategory =
        categoryFilter === "All categories" ||
        item.category === categoryFilter;

      return (
        matchesSearch && matchesStatus && matchesRole && matchesCategory
      );
    });
  }, [permissions, search, statusFilter, roleFilter, categoryFilter]);

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

  function showDemoNotice(action: string, item: PermissionRecord) {
    setNotice(
      `${action}: ${item.document} — ${item.user}. Demo only; no backend changes have been made.`,
    );
  }

  function openDetails(item: PermissionRecord) {
    setSelectedPermission(item);
    setNotice("");
  }

  return (
    <div className={`permissions-page ${theme === "dark" ? "theme-dark" : ""}`}>
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
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
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
            <p className="permissions-eyebrow">SECURITY & GOVERNANCE</p>
            <h1>Permissions</h1>
            <p className="permissions-subtitle">
              Review who can access each document and monitor permission
              status across your workspace.
            </p>
          </div>

          <button
            type="button"
            className="permissions-primary-button"
            onClick={() =>
              setNotice(
                "Grant Permission form is planned as a sub-feature. No permission has been granted.",
              )
            }
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
              <h2>User & Document Access</h2>
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
                            {item.document.endsWith(".pdf") ? "PDF" : "DOC"}
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
                                onClick={() =>
                                  showDemoNotice("Revoke requested", item)
                                }
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
            Demo records only. Grant, edit, and revoke actions are not yet
            connected to the backend. Real access must be checked on every
            protected server request.
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

      {selectedPermission && (
        <div
          className="permissions-modal-backdrop"
          role="presentation"
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
              This is a sample record. Editing and saving permission changes
              will be implemented with the backend.
            </p>

            <button
              type="button"
              className="permissions-primary-button permissions-modal-done"
              onClick={() => setSelectedPermission(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
