
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import "./SharedDocuments.css";

type Permission = "View" | "Download" | "Edit";
type AccessStatus = "Active" | "Expiring Soon" | "Revoked";

type SharedDocument = {
  id: number;
  documentName: string;
  owner: string;
  recipient: string;
  category: string;
  permission: Permission;
  sharedDate: string;
  expiryDate: string;
  status: AccessStatus;
};

const availableDocuments = [
  "Employment Agreement.pdf",
  "Salary Structure.pdf",
  "Project Blueprint.docx",
  "Audit Report.pdf",
  "Project Proposal.docx",
];

const initialDocuments: SharedDocument[] = [
  {
    id: 1,
    documentName: "Employment Agreement.pdf",
    owner: "Hari",
    recipient: "ravi@example.com",
    category: "Contracts",
    permission: "View",
    sharedDate: "2026-10-20",
    expiryDate: "2026-11-20",
    status: "Active",
  },
  {
    id: 2,
    documentName: "Salary Structure.pdf",
    owner: "Hari",
    recipient: "sita@example.com",
    category: "Finance",
    permission: "Download",
    sharedDate: "2026-10-21",
    expiryDate: "2026-10-28",
    status: "Expiring Soon",
  },
  {
    id: 3,
    documentName: "Project Blueprint.docx",
    owner: "Admin",
    recipient: "ravi@example.com",
    category: "Project Files",
    permission: "Edit",
    sharedDate: "2026-10-19",
    expiryDate: "2026-10-25",
    status: "Revoked",
  },
];

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStatus(expiryDate: string): AccessStatus {
  if (expiryDate < getToday()) return "Revoked";

  const today = new Date(`${getToday()}T00:00:00`);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysLeft <= 7 ? "Expiring Soon" : "Active";
}

export default function SharedDocuments() {
  const [documents, setDocuments] =
    useState<SharedDocument[]>(initialDocuments);

  const [documentName, setDocumentName] = useState(availableDocuments[0]);
  const [recipient, setRecipient] = useState("");
  const [permission, setPermission] = useState<Permission>("View");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("Contracts");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [permissionFilter, setPermissionFilter] = useState("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("trustvault-theme") === "dark",
  );

  const activeDocuments = documents.filter(
    (item) => item.status === "Active",
  ).length;

  const expiringDocuments = documents.filter(
    (item) => item.status === "Expiring Soon",
  ).length;

  const revokedDocuments = documents.filter(
    (item) => item.status === "Revoked",
  ).length;

  const filteredDocuments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesSearch = [
        item.documentName,
        item.owner,
        item.recipient,
        item.category,
      ].some((value) => value.toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesPermission =
        permissionFilter === "All" ||
        item.permission === permissionFilter;

      return matchesSearch && matchesStatus && matchesPermission;
    });
  }, [documents, searchTerm, statusFilter, permissionFilter]);

  function toggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("trustvault-theme", next ? "dark" : "light");
  }

  function resetForm() {
    setDocumentName(availableDocuments[0]);
    setRecipient("");
    setPermission("View");
    setExpiryDate("");
    setCategory("Contracts");
    setEditingId(null);
  }

  function handleShareDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const email = recipient.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid recipient email address.");
      return;
    }

    if (!expiryDate) {
      setMessage("Please select an access expiry date.");
      return;
    }

    if (expiryDate < getToday()) {
      setMessage("Expiry date cannot be in the past.");
      return;
    }

    if (editingId !== null) {
      setDocuments((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? {
                ...item,
                documentName,
                recipient: email,
                permission,
                expiryDate,
                category,
                status: getStatus(expiryDate),
              }
            : item,
        ),
      );

      setMessage("Demo sharing record updated successfully.");
      resetForm();
      return;
    }

    const newDocument: SharedDocument = {
      id: Date.now(),
      documentName,
      owner: "Hari",
      recipient: email,
      category,
      permission,
      sharedDate: getToday(),
      expiryDate,
      status: getStatus(expiryDate),
    };

    setDocuments((previous) => [newDocument, ...previous]);
    setMessage("Demo sharing record created successfully.");
    resetForm();
  }

  function handleEdit(item: SharedDocument) {
    if (item.status === "Revoked") {
      setMessage("Revoked access cannot be edited. Create a new record.");
      return;
    }

    setDocumentName(item.documentName);
    setRecipient(item.recipient);
    setPermission(item.permission);
    setExpiryDate(item.expiryDate);
    setCategory(item.category);
    setEditingId(item.id);
    setMessage("Update the form and save your changes.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRevoke(id: number) {
    if (
      !window.confirm(
        "Are you sure you want to revoke this sharing record?",
      )
    ) {
      return;
    }

    setDocuments((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status: "Revoked" } : item,
      ),
    );

    if (editingId === id) resetForm();
    setMessage("Demo sharing record marked as revoked.");
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setPermissionFilter("All");
  }

  return (
    <div className={`shared-page ${isDarkMode ? "theme-dark" : ""}`}>
      <header className="shared-topbar">
        <Link to="/dashboard" className="shared-brand">
          <span className="shared-brand-icon">🔐</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE DOCUMENT MANAGEMENT</small>
          </span>
        </Link>

        <nav className="shared-topbar-nav" aria-label="Main navigation">
          <Link className="shared-nav-link" to="/dashboard">
            Dashboard
          </Link>
          <Link className="shared-nav-link" to="/documents">
            My Documents
          </Link>
          <Link
            className="shared-nav-link shared-nav-active"
            to="/shared-documents"
          >
            Shared Documents
          </Link>
          <Link className="shared-nav-link" to="/permissions">
            Permissions
          </Link>
          <Link className="shared-nav-link" to="/audit-logs">
            Audit Logs
          </Link>
        </nav>

        <div className="shared-topbar-actions">
          <button
            type="button"
            className="shared-theme-toggle"
            onClick={toggleTheme}
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      <main className="shared-content">
        <section className="shared-heading">
          <div>
            <p className="shared-eyebrow">DOCUMENT ACCESS MANAGEMENT</p>
            <h1>Shared Documents</h1>
            <p className="shared-subtitle">
              Manage shared files, recipient permissions and access expiry.
            </p>
          </div>
        </section>

        <div className="shared-security-notice">
          <span>🛡️</span>
          <p>
            <strong>Security reminder</strong>
            <br />
            Grant only the minimum access required. Review permissions and
            expiry dates regularly.
          </p>
        </div>

        {message && (
          <div className="shared-feedback" role="status">
            <p>{message}</p>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="shared-stats">
          <article className="shared-stat-card">
            <span className="shared-stat-icon">📁</span>
            <div>
              <p>Total Records</p>
              <h2>{documents.length}</h2>
            </div>
          </article>

          <article className="shared-stat-card">
            <span className="shared-stat-icon shared-icon-success">✓</span>
            <div>
              <p>Active Access</p>
              <h2>{activeDocuments}</h2>
            </div>
          </article>

          <article className="shared-stat-card">
            <span className="shared-stat-icon shared-icon-warning">◷</span>
            <div>
              <p>Expiring Soon</p>
              <h2>{expiringDocuments}</h2>
            </div>
          </article>

          <article className="shared-stat-card">
            <span className="shared-stat-icon shared-icon-danger">⊘</span>
            <div>
              <p>Revoked Access</p>
              <h2>{revokedDocuments}</h2>
            </div>
          </article>
        </section>

        <section className="shared-panel shared-form-panel">
          <div className="shared-panel-heading">
            <div>
              <h2>
                {editingId !== null ? "Edit Sharing Record" : "Share a Document"}
              </h2>
              <p>Choose the document, recipient and access level.</p>
            </div>
            {editingId !== null && (
              <button
                type="button"
                className="shared-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>

          <form className="shared-form" onSubmit={handleShareDocument}>
            <label>
              <span>Document</span>
              <select
                value={documentName}
                onChange={(event) => setDocumentName(event.target.value)}
                required
              >
                {availableDocuments.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Recipient Email</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Permission</span>
              <select
                value={permission}
                onChange={(event) =>
                  setPermission(event.target.value as Permission)
                }
                required
              >
                <option value="View">View only</option>
                <option value="Download">View and download</option>
                <option value="Edit">Edit document</option>
              </select>
            </label>

            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                <option value="Contracts">Contracts</option>
                <option value="Finance">Finance</option>
                <option value="Project Files">Project Files</option>
                <option value="Audit">Audit</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              <span>Access Expiry Date</span>
              <input
                type="date"
                min={getToday()}
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                required
              />
            </label>

            <div className="shared-form-actions">
              <button type="submit" className="shared-primary-button">
                {editingId !== null ? "Save Changes" : "Share Document"}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  className="shared-secondary-button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="shared-panel shared-management-panel">
          <div className="shared-panel-heading">
            <div>
              <h2>Sharing Records</h2>
              <p>Search, filter, edit or revoke document sharing records.</p>
            </div>
            <span className="shared-record-count">
              {filteredDocuments.length} records
            </span>
          </div>

          <div className="shared-filters">
            <label className="shared-search">
              <span aria-hidden="true">⌕</span>
              <span className="shared-visually-hidden">Search records</span>
              <input
                type="search"
                placeholder="Search document, owner or recipient..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="shared-select-label">
              <span className="shared-visually-hidden">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Revoked">Revoked</option>
              </select>
            </label>

            <label className="shared-select-label">
              <span className="shared-visually-hidden">
                Filter by permission
              </span>
              <select
                value={permissionFilter}
                onChange={(event) => setPermissionFilter(event.target.value)}
              >
                <option value="All">All permissions</option>
                <option value="View">View</option>
                <option value="Download">Download</option>
                <option value="Edit">Edit</option>
              </select>
            </label>

            <button
              type="button"
              className="shared-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <div className="shared-table-wrap">
            <table className="shared-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Recipient</th>
                  <th>Permission</th>
                  <th>Shared Date</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="shared-document-name">
                        <span className="shared-file-icon">FILE</span>
                        <div>
                          <strong>{item.documentName}</strong>
                          <small>{item.category} · {item.owner}</small>
                        </div>
                      </div>
                    </td>
                    <td>{item.recipient}</td>
                    <td>
                      <span className={`shared-permission permission-${item.permission.toLowerCase()}`}>
                        {item.permission}
                      </span>
                    </td>
                    <td>{item.sharedDate}</td>
                    <td>{item.expiryDate}</td>
                    <td>
                      <span
                        className={`shared-status status-${item.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="shared-row-actions">
                        <button
                          type="button"
                          className="shared-view-button"
                          onClick={() => handleEdit(item)}
                          disabled={item.status === "Revoked"}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="shared-revoke-button"
                          onClick={() => handleRevoke(item.id)}
                          disabled={item.status === "Revoked"}
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="shared-empty">
                      <strong>No sharing records found</strong>
                      <p>Try changing your search or filters.</p>
                      <button type="button" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="shared-footnote">
            <strong>Demo mode:</strong> These records are stored only in
            frontend state and reset on refresh. Real access enforcement,
            persistent storage and audit logging require backend integration.
          </p>
        </section>

        <footer className="shared-footer">
          <span>TrustVault · Secure Document Management</span>
          <span>Review access carefully before sharing confidential files.</span>
        </footer>
      </main>
    </div>
  );
}
