
import { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <header className="forgot-brand">
          <div className="forgot-logo">TV</div>
          <h1>TrustVault</h1>
          <p>Secure Document Sharing</p>
        </header>

        <div className="forgot-content">
          <div className="forgot-icon" aria-hidden="true">
            ✉
          </div>

          <h2>Forgot Password?</h2>

          <p className="forgot-description">
            Don't worry! Enter your registered email address
            and we'll help you reset your password.
          </p>

          {submitted ? (
            <div className="forgot-success" role="status">
              <h3>Request submitted</h3>
              <p>
                If an account exists for this email, reset
                instructions can be sent to you.
              </p>
              <p className="forgot-note">
                Email delivery will be enabled after backend integration.
              </p>
            </div>
          ) : (
            <form className="forgot-form" onSubmit={handleSubmit}>
              <label htmlFor="forgot-email">Email Address</label>

              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              <button type="submit">
                Send Reset Instructions
              </button>
            </form>
          )}

          <Link to="/login" className="forgot-back-link">
            <span aria-hidden="true">←</span> Back to Login
          </Link>
        </div>

        <footer className="forgot-footer">
          Your documents. Your permissions. Your trust.
        </footer>
      </section>
    </main>
  );
}

export default ForgotPassword;
