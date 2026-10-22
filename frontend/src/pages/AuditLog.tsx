import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./AuditLog.css";

type Theme = "light" | "dark";
type Result = "Success" | "Denied" | "Failed";
type Action =
  | "Login"
  | "Upload"
  | "View"
  | "Download"
  | "Grant Permission"
  | "Revoke Permission"
  | "Update"
  | "Delete"
  | "Access Denied";

type AuditEvent = {
  id: number;
  timestamp: string;
  user: string;
  email: string;
  action: Action;
  document: string;
  result: Result;
  ipAddress: string;
  details: string;
};

const initialEvents: AuditEvent[] = [
  {
    id: 1008,
    timestamp: "2026-10-23T10:42:00",
    user: "Ravi Kumar",
    email: "ravi@example.com",
    action: "Download",
    document: "Client Contract.pdf",
    result: "Success",
    ipAddress: "192.0.2.18",
    details: "The user downloaded a document they were authorized to access.",
  },
  {
    id: 1007,
    timestamp: "2026-10-23T10:35:00",
    user: "Sita Reddy",
    email: "sita@example.com",
    action: "Access Denied",
    document: "Financial Report.pdf",
    result: "Denied",
    ipAddress: "192.0.2.44",
    details: "Access was denied because the user did not have permission.",
  },
  {
    id: 1006,
    timestamp: "2026-10-23T10:18:00",
    user: "Hari",
    email: "hari@example.com",
    action: "Grant Permission",
    document: "Security Policy.pdf",
    result: "Success",
    ipAddress: "192.0.2.10",
    details: "Viewer access was granted to an authorized user.",
  },
  {
    id: 1005,
    timestamp: "2026-10-23T09:57:00",
    user: "Priya Sharma",
    email: "priya@example.com",
    action: "View",
    document: "Security Policy.pdf",
    result: "Success",
    ipAddress: "192.0.2.27",
    details: "The user opened the document using an active permission.",
  },
  {
    id: 1004,
    timestamp: "2026-10-23T09:40:00",
    user: "Hari",
    email: "hari@example.com",
    action: "Upload",
    document: "Project Proposal.docx",
    result: "Success",
    ipAddress: "192.0.2.10",
    details: "A document was uploaded to the workspace.",
  },
  {
    id: 1003,
    timestamp: "2026-10-22T16:21:00",
    user: "Arjun Rao",
    email: "arjun@example.com",
    action: "Login",
    document: "—",
    result: "Success",
    ipAddress: "192.0.2.31",
    details: "The user signed in successfully.",
  },
  {
    id: 1002,
    timestamp: "2026-10-22T15:12:00",
    user: "Hari",
    email: "hari@example.com",
    action: "Revoke Permission",
    document: "Client Contract.pdf",
    result: "Success",
    ipAddress: "192.0.2.10",
    details: "Access was revoked for a previously authorized user.",
  },
  {
    id: 1001,
    timestamp: "2026-10-22T14:03:00",
    user: "Unknown User",
    email: "unknown@example.com",
    action: "Access Denied",
    document: "Confidential Drawings.pdf",
    result: "Denied",
    ipAddress: "192.0.2.89",
    details: "An unauthorized access attempt was rejected in this demo.",
  },
];

const actionOptions: Action[] = [
  "Login",
  "Upload",
  "View",
  "Download",
  "Grant Permission",
  "Revoke Permission",
  "Update",
  "Delete",
  "Access Denied",
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

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function AuditLog() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [events] = useState<AuditEvent[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All actions");
  const [resultFilter, setResultFilter] = useState("All results");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [notice, setNotice] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);

    try {
      localStorage.setItem("trustvault-theme", next);
    } catch {
      // Theme still works for the current session.
    }
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        [
          event.user,
          event.email,
          event.action,
          event.document,
          event.ipAddress,
          String(event.id),
        ].some((value) => value.toLowerCase().includes(query));

      const matchesAction =
        actionFilter === "All actions" || event.action === actionFilter;

      const matchesResult =
        resultFilter === "All results" || event.result === resultFilter;

      const eventDate = event.timestamp.slice(0, 10);
      const matchesFrom = !fromDate || eventDate >= fromDate;
      const matchesTo = !toDate || eventDate <= toDate;

      return (
        matchesSearch &&
        matchesAction &&
        matchesResult &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [events, search, actionFilter, resultFilter, fromDate, toDate]);

  const successfulCount = events.filter(
    (event) => event.result === "Success",
  ).length;

  const deniedCount = events.filter(
    (event) => event.result === "Denied",
  ).length;

  const downloadCount = events.filter(
    (event) => event.action === "Download",
  ).length;

  const clearFilters = () => {
    setSearch("");
    setActionFilter("All actions");
    setResultFilter("All results");
    setFromDate("");
    setToDate("");
    setNotice("");
  };

  const refreshEvents = () => {
    setLastRefreshed(new Date());
    setNotice(
      "Demo activity list refreshed. Live server events are not connected yet.",
    );
  };

  const exportCsv = () => {
    if (filteredEvents.length === 0) {
      setNotice("No matching events to export. Change or clear your filters.");
      return;
    }

    const headers = [
      "Event ID",
      "Timestamp",
      "User",
      "Email",
      "Action",
      "Document",
      "Result",
      "IP Address",
      "Details",
    ];

    const rows = filteredEvents.map((event) =>
      [
        String(event.id),
        event.timestamp,
        event.user,
        event.email,
        event.action,
        event.document,
        event.result,
        event.ipAddress,
        event.details,
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows,
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `trustvault-audit-log-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setNotice(`${filteredEvents.length} demo event(s) exported to CSV.`);
  };

  return (
    <main className={`audit-page theme-${theme}`}>
      <header className="audit-topbar">
        <Link
          to="/dashboard"
          className="audit-brand"
          aria-label="TrustVault dashboard"
        >
          <span className="audit-brand-mark">T</span>
          <span>TrustVault</span>
        </Link>

        <div className="audit-topbar-right">
          <span className="audit-page-label">Security Activity</span>

          <button
            className="audit-theme-toggle"
            type="button"
            onClick={toggleTheme}
          >
            <span aria-hidden="true">
              {theme === "light" ? "☾" : "☀"}
            </span>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>

          <Link
            className="audit-profile-link"
            to="/profile"
            title="My Profile"
            aria-label="My Profile"
          >
            H
          </Link>
        </div>
      </header>

      <div className="audit-content">
        <div className="audit-breadcrumb-row">
          <Link className="audit-dashboard-link" to="/dashboard">
            <span aria-hidden="true">⌂</span> Dashboard
          </Link>
          <span className="audit-breadcrumb-divider">/</span>
          <span>Audit Log</span>
        </div>

        <section className="audit-heading-row">
          <div>
            <p className="audit-eyebrow">SECURITY &amp; COMPLIANCE</p>
            <h1>Audit Log</h1>
            <p className="audit-subtitle">
              Track document activity, permission changes, and denied access
              attempts.
            </p>
          </div>

          <div className="audit-heading-actions">
            <button
              className="audit-button audit-button-secondary"
              type="button"
              onClick={refreshEvents}
            >
              <span aria-hidden="true">↻</span> Refresh
            </button>
            <button
              className="audit-button audit-button-primary"
              type="button"
              onClick={exportCsv}
            >
              <span aria-hidden="true">⇩</span> Export CSV
            </button>
          </div>
        </section>

        <div className="audit-demo-notice">
          <span className="audit-notice-icon" aria-hidden="true">
            ⓘ
          </span>
          <div>
            <strong>Demo data</strong>
            <p>
              These sample events demonstrate the interface. Production audit
              events must be generated and protected by the Spring Boot backend.
            </p>
          </div>
        </div>

        {notice && (
          <div className="audit-feedback" role="status">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="audit-stats-grid" aria-label="Audit summary">
          <article className="audit-stat-card">
            <div className="audit-stat-top">
              <span>Total events</span>
              <span className="audit-stat-icon blue">≡</span>
            </div>
            <strong>{events.length}</strong>
            <small>Recorded in this demo</small>
          </article>

          <article className="audit-stat-card">
            <div className="audit-stat-top">
              <span>Successful actions</span>
              <span className="audit-stat-icon green">✓</span>
            </div>
            <strong>{successfulCount}</strong>
            <small>Completed successfully</small>
          </article>

          <article className="audit-stat-card">
            <div className="audit-stat-top">
              <span>Denied attempts</span>
              <span className="audit-stat-icon red">!</span>
            </div>
            <strong>{deniedCount}</strong>
            <small>Blocked in sample data</small>
          </article>

          <article className="audit-stat-card">
            <div className="audit-stat-top">
              <span>Downloads</span>
              <span className="audit-stat-icon purple">↓</span>
            </div>
            <strong>{downloadCount}</strong>
            <small>Document download events</small>
          </article>
        </section>

        <section className="audit-log-panel">
          <div className="audit-panel-heading">
            <div>
              <h2>Activity history</h2>
              <p>Search and filter recorded events.</p>
            </div>
            <span className="audit-result-count">
              {filteredEvents.length} events
            </span>
          </div>

          <div className="audit-filters">
            <label className="audit-search-field">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user, document, IP or event ID..."
                aria-label="Search audit events"
              />
            </label>

            <label className="audit-filter-field">
              <span>Action</span>
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
              >
                <option>All actions</option>
                {actionOptions.map((action) => (
                  <option key={action}>{action}</option>
                ))}
              </select>
            </label>

            <label className="audit-filter-field">
              <span>Result</span>
              <select
                value={resultFilter}
                onChange={(event) => setResultFilter(event.target.value)}
              >
                <option>All results</option>
                <option>Success</option>
                <option>Denied</option>
                <option>Failed</option>
              </select>
            </label>

            <label className="audit-filter-field">
              <span>From date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  if (toDate && event.target.value > toDate) {
                    setToDate("");
                  }
                }}
              />
            </label>

            <label className="audit-filter-field">
              <span>To date</span>
              <input
                type="date"
                min={fromDate || undefined}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>

            <button
              className="audit-clear-button"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>

          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Document / Resource</th>
                  <th>Result</th>
                  <th>IP address</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong className="audit-event-id">#{event.id}</strong>
                      <span className="audit-cell-subtext">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </td>
                    <td>
                      <strong>{event.user}</strong>
                      <span className="audit-cell-subtext">
                        {event.email}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`audit-action-tag action-${event.action
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {event.action}
                      </span>
                    </td>
                    <td className="audit-document-cell">{event.document}</td>
                    <td>
                      <span
                        className={`audit-result-tag result-${event.result.toLowerCase()}`}
                      >
                        <span />
                        {event.result}
                      </span>
                    </td>
                    <td className="audit-ip-cell">{event.ipAddress}</td>
                    <td>
                      <button
                        className="audit-details-button"
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="audit-empty-state">
                      <span aria-hidden="true">⌕</span>
                      <strong>No matching events</strong>
                      <p>Try changing your search or clearing the filters.</p>
                      <button
                        className="audit-button audit-button-secondary"
                        type="button"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="audit-panel-footer">
            <span>
              Showing {filteredEvents.length} of {events.length} demo events
            </span>
            <span>
              Last refreshed:{" "}
              {lastRefreshed.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </section>

        <p className="audit-security-note">
          <strong>Security reminder:</strong> the frontend must not enforce
          document permissions by itself. The backend must authorize each
          request and create protected audit records server-side.
        </p>
      </div>

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
            className="audit-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
          >
            <div className="audit-modal-header">
              <div>
                <p className="audit-eyebrow">
                  EVENT #{selectedEvent.id}
                </p>
                <h2 id="audit-detail-title">Event details</h2>
              </div>
              <button
                className="audit-modal-close"
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                ×
              </button>
            </div>

            <div className="audit-modal-result-row">
              <span
                className={`audit-result-tag result-${selectedEvent.result.toLowerCase()}`}
              >
                <span />
                {selectedEvent.result}
              </span>
              <span
                className={`audit-action-tag action-${selectedEvent.action
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                {selectedEvent.action}
              </span>
            </div>

            <dl className="audit-detail-list">
              <div>
                <dt>Date &amp; time</dt>
                <dd>{formatTimestamp(selectedEvent.timestamp)}</dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>
                  {selectedEvent.user}
                  <span>{selectedEvent.email}</span>
                </dd>
              </div>
              <div>
                <dt>Document / resource</dt>
                <dd>{selectedEvent.document}</dd>
              </div>
              <div>
                <dt>IP address</dt>
                <dd>{selectedEvent.ipAddress}</dd>
              </div>
              <div>
                <dt>Event ID</dt>
                <dd>#{selectedEvent.id}</dd>
              </div>
              <div>
                <dt>Details</dt>
                <dd>{selectedEvent.details}</dd>
              </div>
            </dl>

            <div className="audit-modal-footer">
              <button
                className="audit-button audit-button-primary"
                type="button"
                onClick={() => setSelectedEvent(null)}
              >
                Close details
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}