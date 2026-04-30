"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_PASSWORD = "Michael123";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(normalizedEmail)) {
      setError("");
      router.push("/chat");
      return;
    }
    setError("Please enter a valid email address.");
  };

  const goToLanding = (sectionId: string) => {
    window.sessionStorage.setItem("landingTargetSection", sectionId);
    router.push("/");
  };

  const onGuestAccess = () => {
    setEmail("guest@example.com");
    setPassword(DEMO_PASSWORD);
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
            <button type="button" onClick={() => router.push("/signup")}>
              Sign up
            </button>
          </div>
        </header>

        <section className="login-content">
          <div className="login-hero">
            <p className="login-eyebrow">Welcome back</p>
            <h1>Sign in and keep building your case.</h1>
            <p className="login-subtitle">
              Same Case vibe, same workflow. Jump back in, refine your legal strategy, and continue
              from where you left off.
            </p>
          </div>

          <form onSubmit={onSubmit} className="login-form panel">
            <div className="login-form-head">
              <h2>Log in to Case</h2>
              <p>Demo-only gate for the hackathon prototype.</p>
            </div>

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

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-submit">
              Log in
            </button>
            <button type="button" className="login-quick-signin" onClick={onGuestAccess}>
              Continue as guest
            </button>

            <div className="login-social-proof" aria-label="Platform impact stats">
              <article>
                <strong>1,000,000+</strong>
                <span>cases assisted</span>
              </article>
              <article>
                <strong>85%</strong>
                <span>reported improved case outcomes</span>
              </article>
              <article>
                <strong>24/7</strong>
                <span>case guidance support</span>
              </article>
            </div>
          </form>
        </section>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #eaf1ff;
        }

        .login-page :global(.landing-topbar) {
          background: #eaf1ff;
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

        .login-quick-signin {
          min-height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.45);
          background: #ffffff;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
        }

        .login-quick-signin:hover {
          border-color: rgba(37, 99, 235, 0.45);
          color: #1e3a8a;
          transform: translateY(-1px);
        }

        .login-social-proof {
          margin-top: 8px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 12px;
          background: rgba(248, 250, 252, 0.75);
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .login-social-proof article {
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid rgba(148, 163, 184, 0.2);
          padding: 8px 9px;
          display: grid;
          gap: 2px;
          text-align: center;
        }

        .login-social-proof strong {
          font-size: 1rem;
          line-height: 1.1;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .login-social-proof span {
          font-size: 0.72rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
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

        @media (max-width: 860px) {
          .login-social-proof {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
