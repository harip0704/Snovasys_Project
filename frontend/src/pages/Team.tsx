import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Team.css";

type TeamRole = "Admin" | "Owner" | "Viewer";
type MemberStatus = "Active" | "Pending";

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  joined: string;
};

const initialMembers: TeamMember[] = [
  {
    id: 1,
    name: "Hari",
    email: "hari@example.com",
    role: "Admin",
    status: "Active",
    joined: "19 Oct 2026",
  },
  {
    id: 2,
    name: "Ravi Kumar",
    email: "ravi@example.com",
    role: "Owner",
    status: "Active",
    joined: "20 Oct 2026",
  },
  {
    id: 3,
    name: "Sita Devi",
    email: "sita@example.com",
    role: "Viewer",
    status: "Active",
    joined: "21 Oct 2026",
  },
  {
    id: 4,
    name: "Arjun Reddy",
    email: "arjun@example.com",
    role: "Viewer",
    status: "Pending",
    joined: "22 Oct 2026",
  },
];

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("trustvault-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Viewer");

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All roles" || member.role === roleFilter;

      const matchesStatus =
        statusFilter === "All statuses" ||
        member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  const activeCount = members.filter(
    (member) => member.status === "Active"
  ).length;

  const adminCount = members.filter(
    (member) => member.role === "Admin"
  ).length;

  const pendingCount = members.filter(
    (member) => member.status === "Pending"
  ).length;

  function toggleTheme() {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);

    try {
      localStorage.setItem(
        "trustvault-theme",
        nextTheme ? "dark" : "light"
      );
    } catch {
      // Theme still works for this session.
    }
  }

  function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      members.some(
        (member) => member.email.toLowerCase() === normalizedEmail
      )
    ) {
      setMessage("A team member with this email already exists.");
      return;
    }

    const newMember: TeamMember = {
      id: Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      role,
      status: "Pending",
      joined: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setMembers((current) => [...current, newMember]);
    setName("");
    setEmail("");
    setRole("Viewer");
    setShowForm(false);
    setMessage("Demo member added with Pending status.");
  }

  function handleRemoveMember(member: TeamMember) {
    if (member.id === 1) {
      setMessage("The current demo administrator cannot be removed.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.name} from this demo team?`
    );

    if (!confirmed) return;

    setMembers((current) =>
      current.filter((item) => item.id !== member.id)
    );

    setMessage(`${member.name} was removed from the demo list.`);
  }

  function handleRoleChange(memberId: number, newRole: TeamRole) {
    if (memberId === 1) {
      setMessage("The current demo administrator's role cannot be changed.");
      return;
    }

    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? { ...member, role: newRole }
          : member
      )
    );

    setMessage("Demo role updated. Backend authorization is not connected.");
  }

  return (
    <div className={`team-page ${darkMode ? "team-dark" : "team-light"}`}>
      <header className="team-topbar">
        <Link to="/dashboard" className="team-brand">
          <span className="team-brand-icon">◆</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE WORKSPACE</small>
          </span>
        </Link>

        <div className="team-top-actions">
          <button
            type="button"
            className="team-theme-button"
            onClick={toggleTheme}
          >
            {darkMode ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>

          <Link to="/profile" className="team-avatar" aria-label="Open profile">
            H
          </Link>
        </div>
      </header>

      <main className="team-main">
        <div className="team-breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Team</span>
        </div>

        <section className="team-heading">
          <div>
            <p className="team-eyebrow">WORKSPACE MANAGEMENT</p>
            <h1>Team Members</h1>
            <p className="team-subtitle">
              Review workspace members and manage their assigned roles.
            </p>
          </div>

          <button
            type="button"
            className="team-primary-button"
            onClick={() => {
              setMessage("");
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Cancel" : "+ Add member"}
          </button>
        </section>

        <div className="team-demo-notice">
          <span>ⓘ</span>
          <p>
            <strong>Demo mode:</strong> Member changes are stored only in
            this page's React state. Invitations, role enforcement, and
            persistent storage require the backend.
          </p>
        </div>

        {message && (
          <div className="team-message" role="status">
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

        {showForm && (
          <section className="team-panel team-form-panel">
            <h2>Add a team member</h2>
            <p>Enter the member details for this demo workspace.</p>

            <form onSubmit={handleAddMember} className="team-form">
              <label>
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  maxLength={254}
                  required
                />
              </label>

              <label>
                Workspace role
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as TeamRole)
                  }
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>

              <button type="submit" className="team-primary-button">
                Add demo member
              </button>
            </form>
          </section>
        )}

        <section className="team-stats">
          <article className="team-stat-card">
            <span className="team-stat-icon blue">♙</span>
            <p>Total members</p>
            <strong>{members.length}</strong>
            <small>Listed in this demo</small>
          </article>

          <article className="team-stat-card">
            <span className="team-stat-icon green">✓</span>
            <p>Active members</p>
            <strong>{activeCount}</strong>
            <small>Marked active</small>
          </article>

          <article className="team-stat-card">
            <span className="team-stat-icon gold">◆</span>
            <p>Administrators</p>
            <strong>{adminCount}</strong>
            <small>Assigned Admin role</small>
          </article>

          <article className="team-stat-card">
            <span className="team-stat-icon amber">◷</span>
            <p>Pending</p>
            <strong>{pendingCount}</strong>
            <small>Awaiting invitation flow</small>
          </article>
        </section>

        <section className="team-panel">
          <div className="team-panel-heading">
            <div>
              <h2>Workspace directory</h2>
              <p>Search members and review their workspace roles.</p>
            </div>

            <span className="team-member-count">
              {filteredMembers.length} members
            </span>
          </div>

          <div className="team-filters">
            <label className="team-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                aria-label="Search team members"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              aria-label="Filter by role"
            >
              <option>All roles</option>
              <option>Admin</option>
              <option>Owner</option>
              <option>Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option>All statuses</option>
              <option>Active</option>
              <option>Pending</option>
            </select>
          </div>

          <div className="team-table-wrap">
            <table className="team-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date added</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="team-member-cell">
                        <span className="team-member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </span>

                        <span className="team-member-details">
                          <strong>{member.name}</strong>
                          <small>{member.email}</small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <select
                        className="team-role-select"
                        value={member.role}
                        disabled={member.id === 1}
                        aria-label={`Role for ${member.name}`}
                        onChange={(event) =>
                          handleRoleChange(
                            member.id,
                            event.target.value as TeamRole
                          )
                        }
                      >
                        <option value="Admin">Admin</option>
                        <option value="Owner">Owner</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>

                    <td>
                      <span
                        className={`team-status ${
                          member.status === "Active" ? "active" : "pending"
                        }`}
                      >
                        <i />
                        {member.status}
                      </span>
                    </td>

                    <td>{member.joined}</td>

                    <td>
                      <button
                        type="button"
                        className="team-remove-button"
                        disabled={member.id === 1}
                        onClick={() => handleRemoveMember(member)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="team-empty">
                      No team members match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="team-panel-footer">
            <span>Role changes shown here are demo-only.</span>
            <Link to="/permissions">Review document permissions →</Link>
          </div>
        </section>

        <section className="team-role-info">
          <h2>Workspace roles</h2>

          <div className="team-role-grid">
            <article>
              <span className="team-role-symbol admin">◆</span>
              <h3>Admin</h3>
              <p>
                Intended for workspace administration and member management.
              </p>
            </article>

            <article>
              <span className="team-role-symbol owner">▤</span>
              <h3>Owner</h3>
              <p>
                Intended to manage owned documents and their access grants.
              </p>
            </article>

            <article>
              <span className="team-role-symbol viewer">◉</span>
              <h3>Viewer</h3>
              <p>
                Intended to view only documents they are explicitly permitted
                to access.
              </p>
            </article>
          </div>

          <p className="team-security-note">
            Important: These descriptions are UI guidance. Spring Security
            must enforce every role and document permission on the server.
          </p>
        </section>

        <footer className="team-footer">
          <Link to="/dashboard">← Back to Dashboard</Link>
          <span>TrustVault · Secure document sharing</span>
        </footer>
      </main>
    </div>
  );
}