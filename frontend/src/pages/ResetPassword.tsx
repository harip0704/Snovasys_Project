
import { useState } from "react";
import { Link } from "react-router-dom";
import "./ResetPassword.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;

  const isValidPassword =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidPassword || !passwordsMatch) {
      return;
    }

    // UI demonstration only; the backend is not connected yet.
    setSubmitted(true);
  };

  return (
    <main className="reset-page">
      <section className="reset-card">
        <header className="reset-brand">
          <div className="reset-logo">TV</div>
          <h1>TrustVault</h1>
          <p>Secure Document Sharing</p>
        </header>

        <div className="reset-content">
          <div className="reset-icon" aria-hidden="true">
            🔒
          </div>

          <h2>Reset Password</h2>
          <p className="reset-description">
            Create a strong new password to keep your account secure.
          </p>

          {submitted ? (
            <div className="reset-success" role="status">
              <h3>Validation successful!</h3>
              <p>
                Your passwords match and meet the requirements.
                The actual password has not been changed because
                the backend is not connected yet.
              </p>
            </div>
          ) : (
            <form className="reset-form" onSubmit={handleSubmit}>
              <label htmlFor="new-password">New Password</label>

              <div className="reset-password-field">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="reset-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <div className="reset-password-field">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="reset-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="reset-requirements">
                <h3>Password requirements</h3>

                <p className={hasMinLength ? "requirement-met" : ""}>
                  {hasMinLength ? "✓" : "○"} At least 8 characters
                </p>
                <p className={hasUppercase ? "requirement-met" : ""}>
                  {hasUppercase ? "✓" : "○"} One uppercase letter (A–Z)
                </p>
                <p className={hasLowercase ? "requirement-met" : ""}>
                  {hasLowercase ? "✓" : "○"} One lowercase letter (a–z)
                </p>
                <p className={hasNumber ? "requirement-met" : ""}>
                  {hasNumber ? "✓" : "○"} At least one number
                </p>
                <p className={hasSpecial ? "requirement-met" : ""}>
                  {hasSpecial ? "✓" : "○"} One special character
                </p>
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={
                    passwordsMatch
                      ? "reset-match reset-match-success"
                      : "reset-match reset-match-error"
                  }
                  role="status"
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}

              <button
                type="submit"
                className="reset-submit"
                disabled={!isValidPassword || !passwordsMatch}
              >
                Update Password
              </button>
            </form>
          )}

          <Link to="/login" className="reset-back-link">
            ← Back to Login
          </Link>
        </div>

        <footer className="reset-footer">
          Your documents. Your permissions. Your trust.
        </footer>
      </section>
    </main>
  );
}

export default ResetPassword;
