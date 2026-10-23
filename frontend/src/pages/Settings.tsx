import { useState } from "react";
import { Link } from "react-router-dom";
import "./Settings.css";

type SettingsTab = "general" | "security" | "notifications" | "privacy";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("trustvault-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [activityUpdates, setActivityUpdates] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  function toggleTheme() {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);

    try {
      localStorage.setItem(
        "trustvault-theme",
        nextTheme ? "dark" : "light"
      );
    } catch {
      // Theme changes for the current page session.
    }
  }

  function saveSettings() {
    const settings = {
      language,
      timezone,
      emailNotifications,
      securityAlerts,
      activityUpdates,
      twoFactor,
      sessionTimeout,
    };

    try {
      localStorage.setItem(
        "trustvault-settings",
        JSON.stringify(settings)
      );
      setMessage("Settings saved in this browser.");
    } catch {
      setMessage("Unable to save settings in this browser.");
    }
  }

  function resetSettings() {
    setLanguage("English");
    setTimezone("Asia/Kolkata");
    setEmailNotifications(true);
    setSecurityAlerts(true);
    setActivityUpdates(false);
    setTwoFactor(false);
    setSessionTimeout("30");
    setShowConfirm(false);
    setMessage("Settings restored to their default values.");
  }

  return (
    <div className={`settings-page ${darkMode ? "settings-dark" : "settings-light"}`}>
      <header className="settings-topbar">
        <Link to="/dashboard" className="settings-brand">
          <span className="settings-brand-mark">◆</span>
          <span>
            <strong>TrustVault</strong>
            <small>SECURE WORKSPACE</small>
          </span>
        </Link>

        <div className="settings-top-actions">
          <button
            type="button"
            className="settings-theme-button"
            onClick={toggleTheme}
          >
            {darkMode ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>

          <Link
            to="/profile"
            className="settings-avatar"
            aria-label="Open profile"
          >
            H
          </Link>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Settings</span>
        </div>

        <section className="settings-heading">
          <div>
            <p className="settings-eyebrow">WORKSPACE PREFERENCES</p>
            <h1>Settings</h1>
            <p>
              Customize your workspace preferences and review security options.
            </p>
          </div>
        </section>

        <div className="settings-notice" role="note">
          <span>ⓘ</span>
          <p>
            <strong>Frontend demo:</strong> These preferences are saved in this
            browser. Security controls such as two-factor authentication and
            session expiry require backend implementation before they are real.
          </p>
        </div>

        {message && (
          <div className="settings-message" role="status">
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

        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Settings sections">
            <button
              type="button"
              className={activeTab === "general" ? "active" : ""}
              onClick={() => setActiveTab("general")}
            >
              <span>⚙</span> General
            </button>

            <button
              type="button"
              className={activeTab === "security" ? "active" : ""}
              onClick={() => setActiveTab("security")}
            >
              <span>♙</span> Security
            </button>

            <button
              type="button"
              className={activeTab === "notifications" ? "active" : ""}
              onClick={() => setActiveTab("notifications")}
            >
              <span>♢</span> Notifications
            </button>

            <button
              type="button"
              className={activeTab === "privacy" ? "active" : ""}
              onClick={() => setActiveTab("privacy")}
            >
              <span>◈</span> Privacy
            </button>

            <div className="settings-nav-divider" />

            <Link to="/profile">My Profile →</Link>
            <Link to="/team">Team Members →</Link>
            <Link to="/audit-log">Audit Logs →</Link>
          </nav>

          <section className="settings-panel">
            {activeTab === "general" && (
              <>
                <div className="settings-section-heading">
                  <div>
                    <h2>General preferences</h2>
                    <p>Choose how TrustVault works for you.</p>
                  </div>
                  <span className="settings-section-icon">⚙</span>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>Appearance</strong>
                    <p>Switch between light and dark themes.</p>
                  </div>

                  <button
                    type="button"
                    className="settings-inline-button"
                    onClick={toggleTheme}
                  >
                    {darkMode ? "Dark mode on" : "Light mode on"}
                  </button>
                </div>

                <div className="settings-field">
                  <label htmlFor="settings-language">Language</label>
                  <select
                    id="settings-language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    <option>English</option>
                    <option>Telugu</option>
                    <option>Hindi</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label htmlFor="settings-timezone">Time zone</label>
                  <select
                    id="settings-timezone"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  >
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">United Kingdom Time</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === "security" && (
              <>
                <div className="settings-section-heading">
                  <div>
                    <h2>Security preferences</h2>
                    <p>Review account protection options.</p>
                  </div>
                  <span className="settings-section-icon">♙</span>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>Two-factor authentication</strong>
                    <p>
                      Demo preference only; no verification code is sent.
                    </p>
                  </div>

                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={twoFactor}
                      onChange={(event) => setTwoFactor(event.target.checked)}
                    />
                    <span />
                  </label>
                </div>

                <div className="settings-field">
                  <label htmlFor="settings-timeout">
                    Session timeout preference
                  </label>
                  <select
                    id="settings-timeout"
                    value={sessionTimeout}
                    onChange={(event) => setSessionTimeout(event.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                  <small>
                    The backend must enforce actual session expiry.
                  </small>
                </div>

                <div className="settings-security-callout">
                  <strong>Protect your documents</strong>
                  <p>
                    Use server-side authorization, private file storage,
                    secure sessions, and protected audit records.
                  </p>
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <div className="settings-section-heading">
                  <div>
                    <h2>Notification preferences</h2>
                    <p>Choose which updates you want to receive.</p>
                  </div>
                  <span className="settings-section-icon">♢</span>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>Email notifications</strong>
                    <p>Preference for general email updates.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(event) =>
                        setEmailNotifications(event.target.checked)
                      }
                    />
                    <span />
                  </label>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>Security alerts</strong>
                    <p>Preference for denied access and security warnings.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={securityAlerts}
                      onChange={(event) =>
                        setSecurityAlerts(event.target.checked)
                      }
                    />
                    <span />
                  </label>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>Document activity updates</strong>
                    <p>Preference for document changes and sharing updates.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={activityUpdates}
                      onChange={(event) =>
                        setActivityUpdates(event.target.checked)
                      }
                    />
                    <span />
                  </label>
                </div>

                <p className="settings-muted-note">
                  These switches store preferences only; email delivery is not
                  connected.
                </p>
              </>
            )}

            {activeTab === "privacy" && (
              <>
                <div className="settings-section-heading">
                  <div>
                    <h2>Privacy and data</h2>
                    <p>Understand how this demo handles your preferences.</p>
                  </div>
                  <span className="settings-section-icon">◈</span>
                </div>

                <div className="settings-privacy-card">
                  <span>▤</span>
                  <div>
                    <strong>Document access</strong>
                    <p>
                      Access should be granted per document, not automatically
                      to every file in a workspace.
                    </p>
                  </div>
                </div>

                <div className="settings-privacy-card">
                  <span>◷</span>
                  <div>
                    <strong>Audit history</strong>
                    <p>
                      Real document activity must be recorded and protected by
                      the backend from unauthorized modification.
                    </p>
                  </div>
                </div>

                <div className="settings-privacy-card">
                  <span>♙</span>
                  <div>
                    <strong>Browser preferences</strong>
                    <p>
                      This demo stores selected preferences in your browser's
                      local storage. They are not synced to an account.
                    </p>
                  </div>
                </div>

                <div className="settings-security-callout">
                  <strong>Data deletion</strong>
                  <p>
                    This page does not delete account data or stored documents.
                    A production deletion workflow needs authenticated,
                    server-side handling.
                  </p>
                </div>
              </>
            )}

            <div className="settings-actions">
              <button
                type="button"
                className="settings-reset-button"
                onClick={() => setShowConfirm(true)}
              >
                Reset defaults
              </button>

              <button
                type="button"
                className="settings-save-button"
                onClick={saveSettings}
              >
                Save preferences
              </button>
            </div>
          </section>
        </div>

        {showConfirm && (
          <div className="settings-modal-backdrop" role="presentation">
            <section
              className="settings-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-reset-title"
            >
              <span className="settings-modal-icon">!</span>
              <h2 id="settings-reset-title">Reset preferences?</h2>
              <p>
                This restores the preference controls to their default values.
                Your account and documents will not be deleted.
              </p>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-reset-button"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="settings-save-button"
                  onClick={resetSettings}
                >
                  Reset settings
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="settings-footer">
          <Link to="/dashboard">← Back to Dashboard</Link>
          <span>TrustVault · Secure document sharing</span>
        </footer>
      </main>
    </div>
  );
}