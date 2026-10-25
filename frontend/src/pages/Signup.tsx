
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import "./Login.css";

type SignupResponse = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  message?: string;
};

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!name || !normalizedEmail || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (name.length > 100) {
      setError("Full name must not exceed 100 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must contain 8 to 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<SignupResponse>(
        "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email: normalizedEmail,
            password,
          }),
        },
      );

      // Signup is complete, but the user must sign in separately.
      navigate("/login", {
        replace: true,
        state: {
          signupSuccess:
            response?.message ||
            "Account created successfully. Please sign in with your new account.",
          signupEmail: normalizedEmail,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <section className="login-layout">
        <aside className="login-brand-panel">
          <div className="brand-logo">
            <div className="brand-icon">
              <span>✓</span>
            </div>
            <div>
              <h1>TrustVault</h1>
              <p>SECURE DOCUMENT MANAGEMENT</p>
            </div>
          </div>

          <div className="brand-content">
            <span className="eyebrow">YOUR SECURITY, OUR PRIORITY</span>

            <h2>
              One account.
              <br />
              <span>Controlled access.</span>
              <br />
              Greater trust.
            </h2>

            <p className="brand-description">
              Create your account to get ready for secure document
              sharing and controlled collaboration.
            </p>

            <div className="security-features">
              <div className="security-feature">
                <span className="feature-icon">◈</span>
                <div>
                  <h3>Private by design</h3>
                  <p>
                    Documents should be accessible only to authorized users.
                  </p>
                </div>
              </div>

              <div className="security-feature">
                <span className="feature-icon">⌁</span>
                <div>
                  <h3>Account security</h3>
                  <p>
                    Authentication will be handled by the secure backend.
                  </p>
                </div>
              </div>

              <div className="security-feature">
                <span className="feature-icon">⬡</span>
                <div>
                  <h3>Accountability</h3>
                  <p>
                    Document activity will be recorded in the audit trail.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="brand-footer">
            TRUSTED ACCESS. ACCOUNTABLE SHARING.
          </p>
        </aside>

        <section className="login-form-panel">
          <div className="login-heading">
            <span className="welcome-label">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Enter your details to set up your TrustVault account.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="fullName">Full name</label>
              <div className="input-wrapper">
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="signupEmail">Email address</label>
              <div className="input-wrapper">
                <input
                  id="signupEmail"
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
              <label htmlFor="signupPassword">Password</label>
              <div className="input-wrapper">
                <input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="remember-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  required
                />
                <span className="custom-checkbox" />
                I agree to the terms and privacy policy
              </label>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="primary-login-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <span aria-hidden="true"> →</span>}
            </button>
          </form>

          <div className="login-bottom">
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
            <p>© 2026 TrustVault · Secure document sharing</p>
          </div>
        </section>
      </section>
    </main>
  );
}
