
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./AuditLog.css";

type Theme = "light" | "dark";

type Action =
  | "Login"
  | "Logout"
  | "Upload"
  | "View"
  | "Download"
  | "Edit"
  | "Delete"
  | "Grant Permission"
  | "Revoke Permission"
  | "Access Denied";

type Result = "Success" | "Denied" | "Failed";

interface AuditEvent {
  id: number;
  timestamp: string;
  user: string;
  email: string;
  action: Action;
  document: string;
  result: Result;
  ipAddress: string;
  details: string;
  denialReason?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const DEMO_EVENTS: AuditEvent[] = [
  {
    id: 1008,
    timestamp: "2026-10-23T14:42:00",
    user: "Ravi Kumar",
    email: "ravi@example.com",
    action: "Download",
    document: "Employment_Contract.pdf",
    result: "Success",
    ipAddress: "192.0.2.10",
    details: "Document downloaded successfully.",
    metadata: { fileType: "PDF", source: "Demo data" },
  },
  {
    id: 1007,
    timestamp: "2026-10-23T14:30:00",
    user: "Sita Devi",
    email: "sita@example.com",
    action: "Access Denied",
    document: "Salary_Letter.pdf",
    result: "Denied",
    ipAddress: "192.0.2.11",
    details: "Access was denied in this demo event.",
    denialReason: "No document permission in the demo record.",
    metadata: { permissionCheck: "Demo only" },
  },
  {
    id: 1006,
    timestamp: "2026-10-23T13:55:00",
    user: "Hari",
    email: "hari@example.com",
    action: "Grant Permission",
    document: "Project_Design.docx",
    result: "Success",
    ipAddress: "192.0.2.12",
    details: "A document permission grant is represented in this demo record.",
    metadata: { permission: "Viewer", source: "Demo data" },
  },
  {
    id: 1005,
    timestamp: "2026-10-23T13:20:00",
    user: "Priya Sharma",
    email: "priya@example.com",
    action: "View",
    document: "Audit_Report.pdf",
    result: "Success",
    ipAddress: "192.0.2.13",
    details: "Document view event.",
  },
  {
    id: 1004,
    timestamp: "2026-10-23T12:40:00",
    user: "Arjun Rao",
    email: "arjun@example.com",
    action: "Upload",
    document: "Project_Proposal.pdf",
    result: "Success",
    ipAddress: "192.0.2.14",
    details: "Document upload event.",
    metadata: { fileType: "PDF", source: "Demo data" },
  },
  {
    id: 1003,
    timestamp: "2026-10-23T11:15:00",
    user: "Hari",
    email: "hari@example.com",
    action: "Login",
    document: "—",
    result: "Success",
    ipAddress: "192.0.2.15",
    details: "Login event.",
  },
  {
    id: 1002,
    timestamp: "2026-10-22T16:35:00",
    user: "Ravi Kumar",
    email: "ravi@example.com",
    action: "Revoke Permission",
    document: "Employment_Contract.pdf",
    result: "Success",
    ipAddress: "192.0.2.10",
    details: "A permission revocation is represented in this demo record.",
    metadata: { source: "Demo data" },
  },
  {
    id: 1001,
    timestamp: "2026-10-22T15:05:00",
    user: "Unknown User",
    email: "unknown@example.com",
    action: "Access Denied",
    document: "Confidential_Report.pdf",
    result: "Denied",
    ipAddress: "192.0.2.16",
    details: "Access-denied demo event.",
    denialReason: "Permission was not granted in the demo record.",
  },
  {
    id: 1000,
    timestamp: "2026-10-22T14:00:00",
    user: "Sita Devi",
    email: "sita@example.com",
    action: "Edit",
    document: "Audit_Report.pdf",
    result: "Success",
    ipAddress: "192.0.2.11",
    details: "Document edit event.",
  },
  {
    id: 999,
    timestamp: "2026-10-22T13:30:00",
    user: "Hari",
    email: "hari@example.com",
    action: "Logout",
    document: "—",
    result: "Success",
    ipAddress: "192.0.2.15",
    details: "Logout event.",
  },
];

const ACTION_OPTIONS: Action[] = [
  "Login",
  "Logout",
  "Upload",
  "View",
  "Download",
  "Edit",
  "Delete",
  "Grant Permission",
  "Revoke Permission",
  "Access Denied",
];

const RESULT_OPTIONS: Result[] = ["Success", "Denied", "Failed"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
}

function formatDateInput(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: AuditEvent[]): void {
  const headers = [
    "Event ID",
    "Timestamp",
    "User",
    "Email",
    "Action",
    "Resource",
    "Result",
    "IP Address",
    "Details",
    "Denial Reason",
    "Metadata",
  ];

  const csvRows = rows.map((event) => [
    event.id,
    event.timestamp,
    event.user,
    event.email,
    event.action,
    event.document,
    event.result,
    event.ipAddress,
    event.details,
    event.denialReason ?? "",
    JSON.stringify(event.metadata ?? {}),
  ]);

  const csv = [
    headers.map(csvCell).join(","),
    ...csvRows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `trustvault-audit-logs-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getActionLabel(action: Action): string {
  return action === "Access Denied" ? "Access Denied" : action;
}

function AuditLog() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("trustvault-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  const [events, setEvents] = useState<AuditEvent[]>(DEMO_EVENTS);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("trustvault-theme", theme);
    } catch {
      // Theme remains usable for this session if storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    if (!selectedEvent) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            event.id,
            event.user,
            event.email,
            event.action,
            event.document,
            event.ipAddress,
            event.details,
            event.denialReason ?? "",
          ].some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

        const matchesAction = !actionFilter || event.action === actionFilter;
        const matchesResult = !resultFilter || event.result === resultFilter;
        const eventDate = formatDateInput(event.timestamp);
        const matchesFromDate = !fromDate || eventDate >= fromDate;
        const matchesToDate = !toDate || eventDate <= toDate;

        return (
          matchesSearch &&
          matchesAction &&
          matchesResult &&
          matchesFromDate &&
          matchesToDate
        );
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [events, search, actionFilter, resultFilter, fromDate, toDate]);

  const summary = useMemo(
    () => ({
      total: filteredEvents.length,
      successful: filteredEvents.filter((event) => event.result === "Success")
        .length,
      denied: filteredEvents.filter((event) => event.result === "Denied")
        .length,
      downloads: filteredEvents.filter((event) => event.action === "Download")
        .length,
    }),
    [filteredEvents],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, safePage, pageSize]);

  const pageStart = filteredEvents.length ? (safePage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(safePage * pageSize, filteredEvents.length);

  const updateSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateActionFilter = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const updateResultFilter = (value: string) => {
    setResultFilter(value);
    setCurrentPage(1);
  };

  const updateFromDate = (value: string) => {
    setFromDate(value);
    setCurrentPage(1);
    setDateError(
      value && toDate && value > toDate
        ? "From date cannot be later than To date."
        : "",
    );
  };

  const updateToDate = (value: string) => {
    setToDate(value);
    setCurrentPage(1);
    setDateError(
      fromDate && value && fromDate > value
        ? "To date cannot be earlier than From date."
        : "",
    );
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setResultFilter("");
    setFromDate("");
    setToDate("");
    setDateError("");
    setCurrentPage(1);
    setRefreshMessage("");
    setRefreshError("");
  };

  const refreshEvents = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshMessage("");
    setRefreshError("");

    try {
      // Demo mode: replace with an authenticated backend call later.
      await Promise.resolve();
      setEvents([...DEMO_EVENTS]);
      setCurrentPage(1);
      setRefreshMessage(
        "Demo events reloaded. These are not production audit logs.",
      );
    } catch {
      setRefreshError("Unable to reload audit events. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleExport = () => downloadCsv(filteredEvents);

  const handlePageSizeChange = (value: string) => {
    const nextSize = Number(value);

    if (PAGE_SIZE_OPTIONS.includes(nextSize)) {
      setPageSize(nextSize);
      setCurrentPage(1);
    }
  };

  return (
    <div className={`audit-page ${theme === "dark" ? "theme-dark" : ""}`}>
      <header className="audit-topbar">
        <div className="audit-brand-group">
          <Link to="/dashboard" className="audit-brand">
            <span className="audit-brand-icon" aria-hidden="true">
              ◈
            </span>
            <span>TrustVault</span>
          </Link>

          <span className="audit-header-divider" aria-hidden="true" />

          <Link to="/dashboard" className="audit-dashboard-link">
            <span aria-hidden="true">⌂</span>
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="audit-topbar-actions">
          <button
            type="button"
            className="audit-theme-toggle"
            onClick={() =>
              setTheme((previous) => (previous === "dark" ? "light" : "dark"))
            }
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>

          <Link to="/profile" className="audit-profile-link">
            <span className="audit-avatar" aria-hidden="true">
              H
            </span>
            <span>Hari</span>
          </Link>
        </div>
      </header>

      <main className="audit-content">
        <div className="audit-page-heading">
          <div>
            <p className="audit-eyebrow">SECURITY &amp; COMPLIANCE</p>
            <h1>Audit Log</h1>
            <p className="audit-subtitle">
              Review document activity and access events.
            </p>
          </div>

          <div className="audit-heading-actions">
            <button
              type="button"
              className="audit-secondary-button"
              onClick={refreshEvents}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              className="audit-primary-button"
              onClick={handleExport}
              disabled={filteredEvents.length === 0}
            >
              ↓ Export CSV
            </button>
          </div>
        </div>

        <div className="audit-demo-notice" role="note">
          <strong>Demo mode:</strong> The events displayed here are sample
          records, not verified production security logs. Production audit
          events must be generated and protected by the backend.
        </div>

        {refreshMessage && (
          <p className="audit-feedback" role="status">
            {refreshMessage}
          </p>
        )}

        {refreshError && (
          <p className="audit-error" role="alert">
            {refreshError}
          </p>
        )}

        <section
          className="audit-stats-grid"
          aria-label="Summary of filtered audit events"
        >
          <article className="audit-stat-card">
            <span className="audit-stat-label">Total Events</span>
            <strong className="audit-stat-value">{summary.total}</strong>
            <span className="audit-stat-description">Matching filters</span>
          </article>

          <article className="audit-stat-card">
            <span className="audit-stat-label">Successful Actions</span>
            <strong className="audit-stat-value">{summary.successful}</strong>
            <span className="audit-stat-description">Result: Success</span>
          </article>

          <article className="audit-stat-card">
            <span className="audit-stat-label">Denied Attempts</span>
            <strong className="audit-stat-value">{summary.denied}</strong>
            <span className="audit-stat-description">Result: Denied</span>
          </article>

          <article className="audit-stat-card">
            <span className="audit-stat-label">Downloads</span>
            <strong className="audit-stat-value">{summary.downloads}</strong>
            <span className="audit-stat-description">Matching downloads</span>
          </article>
        </section>

        <section className="audit-filters" aria-label="Audit filters">
          <div className="audit-filter-field audit-search-field">
            <label htmlFor="audit-search">Search activity</label>
            <input
              id="audit-search"
              type="search"
              placeholder="Search user, document, IP, event ID..."
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-action-filter">Action</label>
            <select
              id="audit-action-filter"
              value={actionFilter}
              onChange={(event) => updateActionFilter(event.target.value)}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-result-filter">Result</label>
            <select
              id="audit-result-filter"
              value={resultFilter}
              onChange={(event) => updateResultFilter(event.target.value)}
            >
              <option value="">All results</option>
              {RESULT_OPTIONS.map((result) => (
                <option key={result} value={result}>
                  {result}
                </option>
              ))}
            </select>
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-from-date">From date</label>
            <input
              id="audit-from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => updateFromDate(event.target.value)}
            />
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-to-date">To date</label>
            <input
              id="audit-to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => updateToDate(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="audit-clear-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

          {dateError && (
            <p className="audit-error audit-date-error" role="alert">
              {dateError}
            </p>
          )}
        </section>

        <section className="audit-history-section">
          <div className="audit-history-heading">
            <div>
              <h2>Activity History</h2>
              <p>
                Showing {pageStart}–{pageEnd} of {filteredEvents.length} matching
                events
              </p>
            </div>

            <label className="audit-page-size-control">
              <span>Rows per page</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th scope="col">Event ID</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col">User</th>
                  <th scope="col">Action</th>
                  <th scope="col">Resource</th>
                  <th scope="col">Result</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>

              <tbody>
                {paginatedEvents.map((event) => (
                  <tr key={event.id}>
                    <td>#{event.id}</td>
                    <td>{formatTimestamp(event.timestamp)}</td>
                    <td>
                      <div className="audit-user-cell">
                        <strong>{event.user}</strong>
                        <span>{event.email || "—"}</span>
                      </div>
                    </td>
                    <td>{getActionLabel(event.action)}</td>
                    <td>{event.document || "—"}</td>
                    <td>
                      <span
                        className={`audit-result-badge audit-result-${event.result.toLowerCase()}`}
                      >
                        {event.result}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="audit-view-button"
                        onClick={() => setSelectedEvent(event)}
                        aria-label={`View details for event ${event.id}`}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}

                {paginatedEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="audit-empty-state">
                      <strong>No audit events found</strong>
                      <p>
                        Try changing your search or filters, or clear all
                        filters to view the available demo events.
                      </p>
                      <button
                        type="button"
                        className="audit-clear-button"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <nav className="audit-pagination" aria-label="Audit log pagination">
            <span>
              Page {safePage} of {totalPages}
            </span>

            <div className="audit-pagination-actions">
              <button
                type="button"
                className="audit-secondary-button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                aria-label="Go to first page"
              >
                First
              </button>

              <button
                type="button"
                className="audit-secondary-button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safePage <= 1}
                aria-label="Go to previous page"
              >
                Previous
              </button>

              <button
                type="button"
                className="audit-secondary-button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safePage >= totalPages}
                aria-label="Go to next page"
              >
                Next
              </button>

              <button
                type="button"
                className="audit-secondary-button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                aria-label="Go to last page"
              >
                Last
              </button>
            </div>
          </nav>
        </section>
      </main>

      {selectedEvent && (
        <div
          className="audit-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEvent(null);
            }
          }}
        >
          <section
            className="audit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
            aria-describedby="audit-modal-description"
          >
            <div className="audit-modal-header">
              <div>
                <p className="audit-eyebrow">EVENT DETAILS</p>
                <h2 id="audit-modal-title">
                  Audit Event #{selectedEvent.id}
                </h2>
              </div>

              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
                autoFocus
              >
                ×
              </button>
            </div>

            <p
              id="audit-modal-description"
              className="audit-modal-description"
            >
              Details for this demo record. Verify production events through
              the authenticated backend.
            </p>

            <div className="audit-modal-grid">
              <div className="audit-modal-item">
                <span>Event ID</span>
                <strong>#{selectedEvent.id}</strong>
              </div>

              <div className="audit-modal-item">
                <span>Timestamp</span>
                <strong>{formatTimestamp(selectedEvent.timestamp)}</strong>
              </div>

              <div className="audit-modal-item">
                <span>User</span>
                <strong>{selectedEvent.user || "Unknown user"}</strong>
              </div>

              <div className="audit-modal-item">
                <span>Email</span>
                <strong>{selectedEvent.email || "Not available"}</strong>
              </div>

              <div className="audit-modal-item">
                <span>Action</span>
                <strong>{selectedEvent.action}</strong>
              </div>

              <div className="audit-modal-item">
                <span>Resource</span>
                <strong>{selectedEvent.document || "Not applicable"}</strong>
              </div>

              <div className="audit-modal-item">
                <span>Result</span>
                <strong>{selectedEvent.result}</strong>
              </div>

              <div className="audit-modal-item">
                <span>IP Address</span>
                <strong>{selectedEvent.ipAddress || "Not available"}</strong>
              </div>

              <div className="audit-modal-item audit-modal-full-width">
                <span>Event details</span>
                <p>
                  {selectedEvent.details || "No additional details available."}
                </p>
              </div>

              {selectedEvent.result === "Denied" && (
                <div className="audit-modal-item audit-modal-full-width">
                  <span>Denial reason</span>
                  <p>
                    {selectedEvent.denialReason ||
                      "No denial reason recorded in this demo event."}
                  </p>
                </div>
              )}

              <div className="audit-modal-item audit-modal-full-width">
                <span>Metadata</span>
                <pre>
                  {JSON.stringify(selectedEvent.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="audit-modal-footer">
              <button
                type="button"
                className="audit-primary-button"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AuditLog;
