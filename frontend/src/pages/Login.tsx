
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // TODO: Connect to the Spring Boot login API.
      // Frontend validation alone is not authentication.
      setError(
        "Authentication is not connected yet. Please connect the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSocialLogin(provider: "Google" | "GitHub") {
    setError(
      `${provider} sign-in is not configured yet. Backend OAuth integration is required.`
    );
  }

  async function handlePasskey() {
    if (!window.PublicKeyCredential) {
      setError("Passkeys are not supported in this browser.");
      return;
    }

    setError(
      "Passkey sign-in is not configured yet. Backend WebAuthn integration is required."
    );
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <section className="login-layout">
        <aside className="login-brand-panel">
          <div className="brand-logo">
            <div className="brand-icon">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M24 4 41 11V22C41 33 34 40 24 44 14 40 7 33 7 22V11L24 4Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  d="m16 24 5 5 11-12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h1>TrustVault</h1>
              <p>SECURE DOCUMENT MANAGEMENT</p>
            </div>
          </div>

          <div className="brand-content">
            <span className="eyebrow">
              <span className="status-dot" />
              YOUR SECURITY, OUR PRIORITY
            </span>

            <h2>
              Your documents.
              <br />
              <span>Your control.</span>
              <br />
              Your security.
            </h2>

            <p className="brand-description">
              Protect confidential documents with controlled access,
              secure sharing, and a transparent audit trail.
            </p>

            <div className="security-features">
              <div className="security-feature">
                <span className="feature-icon">◈</span>
                <div>
                  <h3>Private by design</h3>
                  <p>Access only what you are authorized to see.</p>
                </div>
              </div>

              <div className="security-feature">
                <span className="feature-icon">⌁</span>
                <div>
                  <h3>Every action matters</h3>
                  <p>Track document access through audit events.</p>
                </div>
              </div>

              <div className="security-feature">
                <span className="feature-icon">⬡</span>
                <div>
                  <h3>Secure collaboration</h3>
                  <p>Share documents with controlled permissions.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="brand-footer">
            TRUSTED ACCESS. ACCOUNTABLE SHARING.
          </p>
        </aside>

        <section className="login-form-panel">
          <div className="mobile-brand">
            <div className="brand-icon">
              <span>✓</span>
            </div>
            <h1>TrustVault</h1>
          </div>

          <div className="login-heading">
            <span className="welcome-label">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Enter your credentials to access your secure workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="input-wrapper">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="11"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />
                <span className="custom-checkbox" />
                Remember me
              </label>

              <span className="session-note">Secure sign-in</span>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            <button
              className="primary-login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in securely
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          {/* Create Account link */}
          <p className="signup-prompt">
            Don't have an account?{" "}
            <Link to="/signup">Create account</Link>
          </p>

          <div className="divider">
            <span />
            <p>OR CONTINUE WITH</p>
            <span />
          </div>

          <div className="social-buttons">
            <button
              type="button"
              className="social-button"
              onClick={() => handleSocialLogin("Google")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.38a4.6 4.6 0 0 1-2 3.02v2.46h3.24c1.9-1.75 2.98-4.33 2.98-7.34Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.46c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.07v2.53A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.42 13.95a6 6 0 0 1 0-3.9V7.52H3.07a10 10 0 0 0 0 8.96l3.35-2.53Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.93c1.47 0 2.8.5 3.84 1.52l2.88-2.88C16.96 2.94 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.35 2.53C7.2 7.69 9.4 5.93 12 5.93Z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              className="social-button"
              onClick={() => handleSocialLogin("GitHub")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.04-.3 3.04-1.14.61 1.54 3.04-1.14 3.04 1.14.61 1.54.12 2.68.12 2.96.71.78 1.14 1.78 1.14 3.01 0 4.29-2.61 5.23-5.1 5.5.4.35.75 1.03.75 2.08v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"
                />
              </svg>
              GitHub
            </button>
          </div>

          <button
            type="button"
            className="passkey-button"
            onClick={handlePasskey}
          >
            <span className="passkey-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="10" width="18" height="11" rx="2" />
                <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                <circle cx="12" cy="15" r="1.5" />
                <path d="M12 16.5V18" />
              </svg>
            </span>

            <span className="passkey-copy">
              <strong>Use a passkey</strong>
              <small>Face recognition, fingerprint or device PIN</small>
            </span>

            <span className="passkey-arrow">→</span>
          </button>

          <div className="login-bottom">
            <div className="privacy-note">
              <span aria-hidden="true">♧</span>
              Your credentials are protected by secure authentication.
            </div>
            <p>© 2026 TrustVault · Secure document sharing</p>
          </div>
        </section>
      </section>
    </main>
  );
}
