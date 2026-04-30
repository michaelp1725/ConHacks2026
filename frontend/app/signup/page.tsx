"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const goToLanding = (sectionId: string) => {
    window.sessionStorage.setItem("landingTargetSection", sectionId);
    router.push("/");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    router.push("/chat");
  };

  return (
    <main className="login-page">
      <div className="page">
        <header className="landing-topbar" aria-label="Site navigation">
          <button
            type="button"
            className="landing-brand landing-brand-button"
            onClick={() => router.push("/")}
          >
            <img src="/assets/case-logo.png" alt="Case logo" className="landing-logo" />
            <small>Legal research, redefined.</small>
          </button>
          <nav className="landing-nav" aria-label="Primary">
            <button type="button" className="landing-nav-link" onClick={() => goToLanding("onboarding")}>
              Product
            </button>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => goToLanding("landing-features")}
            >
              Features
            </button>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => goToLanding("landing-pricing")}
            >
              Pricing
            </button>
            <button type="button" className="landing-nav-link" onClick={() => goToLanding("landing-about")}>
              About
            </button>
          </nav>
          <div className="landing-auth-actions">
            <button type="button" className="secondary" onClick={() => router.push("/login")}>
              Log in
            </button>
          </div>
        </header>

        <section className="login-content">
          <div className="login-hero">
            <p className="login-eyebrow">Create your account</p>
            <h1>Join Case and start building your strategy.</h1>
            <p className="login-subtitle">
              Set up your account in under a minute and organize your legal prep with source-backed
              guidance from day one.
            </p>
          </div>

          <form onSubmit={onSubmit} className="login-form panel">
            <div className="login-form-head">
              <h2>Sign up!!</h2>
              <p>Join 10,000+ active weekly users and use Case!!</p>
            </div>

            <label>
              <span>Full name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Michael Parker"
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. Michael123"
                required
              />
            </label>

            <label>
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="e.g. Michael123"
                required
              />
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-submit">
              Create account
            </button>
          </form>
        </section>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #f1efff;
        }

        .login-page :global(.landing-topbar) {
          background: #f1efff;
          border-bottom-color: rgba(148, 163, 184, 0.24);
          backdrop-filter: none;
          animation: authFadeIn 360ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .page {
          padding-top: 0;
        }

        .login-content {
          max-width: 100%;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          padding-top: 8px;
        }

        .login-hero {
          max-width: 100%;
          margin: 0;
          text-align: center;
          opacity: 0;
          animation: authFadeUp 520ms cubic-bezier(0.16, 1, 0.3, 1) 90ms forwards;
        }

        .login-eyebrow {
          margin: 0;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .login-hero h1 {
          margin: 8px 0 10px;
          font-size: clamp(2rem, 4.4vw, 3.6rem);
          line-height: 1.12;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          margin: 0;
          color: #475569;
          line-height: 1.62;
          max-width: 70ch;
          margin-left: auto;
          margin-right: auto;
        }

        .login-form {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 22px;
          display: grid;
          gap: 12px;
          align-content: start;
          opacity: 0;
          animation: authFadeUp 520ms cubic-bezier(0.16, 1, 0.3, 1) 160ms forwards;
        }

        .login-form-head h2 {
          margin: 0;
          font-size: 1.4rem;
          letter-spacing: -0.01em;
        }

        .login-form-head p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 0.92rem;
        }

        .login-form label {
          display: grid;
          gap: 6px;
        }

        .login-form label span {
          color: #334155;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .login-form input {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          min-height: 44px;
          padding: 10px 12px;
          font-size: 0.95rem;
          color: #0f172a;
          background: #fff;
        }

        .login-form input:focus {
          outline: 2px solid rgba(37, 99, 235, 0.4);
          outline-offset: 1px;
          border-color: rgba(37, 99, 235, 0.52);
        }

        .login-error {
          margin: 0;
          color: #b91c1c;
          font-size: 0.88rem;
        }

        .login-submit {
          margin-top: 4px;
          border: 1px solid rgba(0, 82, 255, 0.6);
          background: linear-gradient(135deg, #0052ff 0%, #4d7cff 100%);
          color: #fff;
          border-radius: 10px;
          min-height: 44px;
          font-weight: 700;
          cursor: pointer;
        }

        .login-submit:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        @keyframes authFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes authFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
