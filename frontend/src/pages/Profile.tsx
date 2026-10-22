
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

type Theme = "light" | "dark";

type ProfileDetails = {
  name: string;
  email: string;
  role: string;
};

const initialProfile: ProfileDetails = {
  name: "Hari",
  email: "hari@example.com",
  role: "Administrator",
};

function getSavedTheme(): Theme {
  try {
    return localStorage.getItem("trustvault-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function Profile() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const [profile, setProfile] = useState<ProfileDetails>(initialProfile);
  const [form, setForm] = useState<ProfileDetails>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    try {
      localStorage.setItem("trustvault-theme", nextTheme);
    } catch {
      // Theme still changes for this page.
    }
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setMessage("Please enter both your name and email.");
      return;
    }

    setProfile({ ...form, name, email });
    setForm({ ...form, name, email });
    setEditing(false);
    setMessage("Profile changes saved in this demo.");
  }

  function handleCancel() {
    setForm(profile);
    setEditing(false);
    setMessage("");
  }

  function handleLogout() {
    try {
      localStorage.removeItem("trustvault-demo-session");
      sessionStorage.clear();
    } catch {
      // Continue to the login page if browser storage is unavailable.
    }

    navigate("/login", { replace: true });
  }

  return (
    <div className={`profile-page ${theme === "dark" ? "profile-dark" : ""}`}>
      <header className="profile-topbar">
        <Link to="/dashboard" className="profile-brand">
          <span className="profile-brand-icon">🔐</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE DOCUMENT WORKSPACE</small>
          </span>
        </Link>

        <div className="profile-topbar-actions">
          <Link to="/dashboard" className="profile-nav-link">
            ← Dashboard
          </Link>

          <button
            type="button"
            className="profile-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          <button
            type="button"
            className="profile-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="profile-content">
        <div className="profile-breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>My Profile</span>
        </div>

        <section className="profile-heading">
          <div>
            <p className="profile-eyebrow">ACCOUNT MANAGEMENT</p>
            <h1>My Profile</h1>
            <p>Manage your personal details and account information.</p>
          </div>
        </section>

        {message && (
          <div className="profile-message" role="status">
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

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-avatar-large">
              {profile.name.charAt(0).toUpperCase() || "H"}
            </div>

            <div className="profile-identity">
              <h2>{profile.name}</h2>
              <p>{profile.role}</p>
              <span className="profile-account-status">
                <span /> Demo account
              </span>
            </div>

            {!editing && (
              <button
                type="button"
                className="profile-edit-button"
                onClick={() => {
                  setForm(profile);
                  setEditing(true);
                  setMessage("");
                }}
              >
                ✎ Edit Profile
              </button>
            )}
          </div>

          <div className="profile-divider" />

          <div className="profile-section-heading">
            <h3>Personal Information</h3>
            <p>Review your details below.</p>
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Full Name</span>
                <input
                  type="text"
                  value={editing ? form.name : profile.name}
                  readOnly={!editing}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Enter your full name"
                  required
                  maxLength={100}
                />
              </label>

              <label className="profile-field">
                <span>Email Address</span>
                <input
                  type="email"
                  value={editing ? form.email : profile.email}
                  readOnly={!editing}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="Enter your email address"
                  required
                  maxLength={254}
                />
              </label>

              <label className="profile-field">
                <span>Role</span>
                <input type="text" value={profile.role} readOnly />
                <small>
                  Role changes can only be made by an authorized administrator.
                </small>
              </label>

              <label className="profile-field">
                <span>Workspace</span>
                <input
                  type="text"
                  value="TrustVault"
                  readOnly
                />
              </label>
            </div>

            {editing && (
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button type="submit" className="profile-save-button">
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="profile-security-card">
          <div className="profile-security-icon">🛡️</div>
          <div>
            <h3>Account Security</h3>
            <p>
              Your access to confidential documents should be controlled by
              verified authentication and server-side permissions.
            </p>
          </div>
        </section>

        <footer className="profile-footer">
          <span>TrustVault · Secure document sharing</span>
          <Link to="/dashboard">Back to Dashboard ↑</Link>
        </footer>
      </main>
    </div>
  );
}
