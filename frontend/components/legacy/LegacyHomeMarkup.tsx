import Link from "next/link";

export function LegacyHomeMarkup() {
  return (
    <>
      <div className="ambient" />
      <div className="page">
        <header className="landing-topbar" aria-label="Account actions">
          <div className="landing-brand">
            <img
              src="/assets/case-logo.png"
              alt="Case logo"
              className="landing-logo"
            />
            <small>Legal research, redefined.</small>
          </div>
          <nav className="landing-nav" aria-label="Primary">
            <a href="#onboarding">Product</a>
            <a href="#landing-features">Features</a>
            <a href="#landing-pricing">Pricing</a>
            <a href="#landing-about">About</a>
          </nav>
          <div className="landing-auth-actions">
            <button type="button" className="secondary">
              Log in
            </button>
            <button type="button">Sign up</button>
          </div>
        </header>
        <section id="onboarding" className="onboarding">
          <h1>
            Where law meets
            <span className="gradient-text"> clarity</span>
          </h1>
          <p className="subtitle">
            Ask one question and skip hours of precedent searching with a clear
            case plan in under a minute.
          </p>
          <div className="onboarding-cta-row">
            <Link href="/chat" id="get-started-btn">
              Get Started
            </Link>
          </div>
          <p className="onboarding-help">
            No legal jargon required. You can refine and re-run anytime.
          </p>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-ring" />
            <div className="hero-card hero-card-a">
              <strong>Issue Summary</strong>
              <span>Retaliatory eviction angle detected</span>
            </div>
            <div className="hero-card hero-card-b">
              <strong>Authorities</strong>
              <span>2 statutes + 1 case linked</span>
            </div>
            <div className="hero-corner-pill">LIVE ANALYSIS</div>
          </div>
        </section>

        <section id="landing-features" className="landing-section">
          <h2>How Case works for you</h2>
          <p className="section-intro">
            Straight answers, practical structure, and less stress when you need
            to prepare fast.
          </p>
          <div className="landing-grid">
            <article className="landing-mini-card feature-card" tabIndex={0}>
              <h3>We find the precedent.</h3>
              <p>
                You tell us what happened. We pull the cases and rules that
                actually matter.
              </p>
            </article>
            <article className="landing-mini-card feature-card" tabIndex={0}>
              <h3>Your argument gets shaped.</h3>
              <p>
                We turn your facts into something clear, direct, and ready to say
                out loud.
              </p>
            </article>
            <article className="landing-mini-card feature-card" tabIndex={0}>
              <h3>YOU are in charge.</h3>
              <p>
                You can edit everything, rerun with new details, and keep refining
                until it sounds like you and feels ready to use.
              </p>
            </article>
          </div>
        </section>

        <section id="landing-pricing" className="landing-section">
          <h2>Pricing & Subscriptions</h2>
          <div className="landing-grid">
            <article className="landing-mini-card plan-card">
              <p className="plan-tier">Most practical</p>
              <h3>Free</h3>
              <p className="plan-price">$0 / mo</p>
              <p>Everything you need. No strings attached. We mean it.</p>
              <ul className="plan-features">
                <li>Full case research</li>
                <li>Issue summaries</li>
                <li>Argument structure</li>
                <li>Evidence checklist</li>
              </ul>
              <a
                className="plan-cta"
                href="https://en.wikipedia.org/wiki/Law"
                target="_blank"
                rel="noreferrer"
              >
                Choose Free
              </a>
            </article>
            <article className="landing-mini-card plan-card plan-card-featured">
              <p className="plan-tier">Most popular</p>
              <h3>Pro</h3>
              <p className="plan-price">$0.00 / mo</p>
              <p>Same as Free. But the name sounds better at dinner parties.</p>
              <ul className="plan-features">
                <li>Everything in Free</li>
                <li>Richer exports</li>
                <li>Citation tracking</li>
                <li>Expanded history</li>
              </ul>
              <a
                className="plan-cta plan-cta-featured"
                href="https://www.canlii.org/en/"
                target="_blank"
                rel="noreferrer"
              >
                Go Pro
              </a>
            </article>
            <article className="landing-mini-card plan-card">
              <p className="plan-tier">Power user mode</p>
              <h3>Ultra</h3>
              <p className="plan-price">$0.000001 / mo</p>
              <p>
                For power users who like paying fractions of a cent for the vibe.
              </p>
              <ul className="plan-features">
                <li>Everything in Pro</li>
                <li>Faster replies (emotionally, not technically)</li>
                <li>Exclusive badge</li>
                <li>We&apos;ll send you $100 (in Monopoly money)</li>
              </ul>
              <a
                className="plan-cta"
                href="https://www.legalaid.on.ca/"
                target="_blank"
                rel="noreferrer"
              >
                Unlock Ultra
              </a>
            </article>
            <article className="landing-mini-card plan-card">
              <p className="plan-tier">Big business energy</p>
              <h3>Enterprise</h3>
              <p className="plan-price">
                Contact us <span className="plan-price-note">(still free lol)</span>
              </p>
              <p>For law firms who want to feel like they negotiated a deal.</p>
              <ul className="plan-features">
                <li>Everything in Ultra</li>
                <li>Custom onboarding</li>
                <li>Dedicated vibes</li>
                <li>We&apos;ll hop on a call</li>
              </ul>
              <a
                className="plan-cta"
                href="https://pointerpointer.com/"
                target="_blank"
                rel="noreferrer"
              >
                Contact Sales
              </a>
            </article>
          </div>
        </section>

        <section id="landing-about" className="landing-section">
          <h2>About Case</h2>
          <div className="landing-grid">
            <article className="landing-mini-card about-story">
              <h3>How Case came to be</h3>
              <p>
                Nate&apos;s girlfriend Jackie is a pre-law student who has
                completed legal research projects and helped friends and family
                self-represent through difficult disputes. After seeing how hard the
                process can be firsthand, we created Case to make legal prep more
                useful for people who need to self-represent.
              </p>
            </article>
            <article className="landing-mini-card about-disclaimer">
              <h3>Disclaimer</h3>
              <p>
                Case provides legal information and argument structure support, but
                it is NOT legal advice. We are not licensed lawyers and are not
                liable for outcomes related to your legal matter. Please verify key
                details with official sources and use your own judgment before
                relying on any output.
              </p>
            </article>
          </div>
        </section>

        <section id="landing-team" className="landing-section">
          <h2>Our team</h2>
          <p className="landing-copy team-copy">
            Tiny team, big legal-prep energy. Meet us!
          </p>
          <div className="landing-grid team-grid">
            <article className="landing-mini-card team-card">
              <img
                src="/assets/team/michael-parker.jpg"
                alt="Michael Parker"
                className="team-photo"
              />
              <p className="team-role">Chief Negative PnL Officer</p>
              <h3>Michael Parker</h3>
              <p>
                Math student at UW who loves poker and somehow remains world-class
                at harvesting negative PnL. Plays Volleyball and serves as an
                executive on Waterloo&apos;s Serve Volleyball Club - feel free to
                come out and say hi!!
              </p>
              <a
                className="team-link"
                href="https://www.linkedin.com/in/michael-parker-7000a22a1/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </article>
            <article className="landing-mini-card team-card">
              <img
                src="/assets/team/nate-mastronardi.jpg"
                alt="Nate Mastronardi"
                className="team-photo"
              />
              <p className="team-role">Head of Courtroom Aura</p>
              <h3>Nate Mastronardi</h3>
              <p>
                CS Student at UW. Loves playing volleyball (especially beach) since
                it&apos;s competitive and good vibes. Spending this semester in the
                gym doing some training for a hyrox in september. During free time
                builds cool things.
              </p>
              <a
                className="team-link"
                href="https://www.linkedin.com/in/natemastronardi/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </article>
            <article className="landing-mini-card team-card">
              <img
                src="/assets/team/evan-lamb.jpg"
                alt="Evan Lamb"
                className="team-photo"
              />
              <p className="team-role">World-Class Leetcoder</p>
              <h3>Evan Lamb</h3>
              <p>
                CS Student at UW. Loves playing spikeball and grinding leetcode.
                Spending the semester focusing on spending less time on school and
                more time on fun sidequests. Loves all food and is always looking to
                eat.
              </p>
              <a
                className="team-link"
                href="https://www.linkedin.com/in/evanlamb11/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </article>
          </div>
        </section>
        <p className="landing-footer-note">MEN Corp. | 2026</p>
      </div>
    </>
  );
}
