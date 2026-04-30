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
            <button id="get-started-btn" type="button">
              Get Started
            </button>
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

        <section id="app-shell" className="hidden">
          <header className="topbar">
            <div className="brand">
              <img
                src="/assets/case-logo.png"
                alt="Case logo"
                className="app-logo"
              />
            </div>
            <span className="badge">Where law meets clarity.</span>
          </header>

          <main className="app-layout">
            <aside className="sidebar panel">
              <div className="sidebar-head">
                <h2>Chats</h2>
                <button type="button" id="new-chat-btn" className="secondary">
                  New
                </button>
              </div>
              <div id="chat-list" className="chat-list" />
            </aside>

            <section className="panel workspace">
              <header className="hero">
                <p className="eyebrow">Ask in plain language</p>
                <h1>Build your case with source-backed legal guidance</h1>
                <p className="subtitle">
                  Explain your issue once. Get structured arguments, citations, and
                  next steps you can use immediately.
                </p>
                <div className="hero-fun-row" aria-hidden="true">
                  <div className="mascot-group">
                    <div className="mascot mascot-blue">
                      <span className="mascot-eye left" />
                      <span className="mascot-eye right" />
                      <span className="mascot-smile" />
                    </div>
                    <div className="mascot mascot-navy">
                      <span className="mascot-eye left" />
                      <span className="mascot-eye right" />
                      <span className="mascot-smile" />
                    </div>
                  </div>
                  <div className="hero-pills">
                    <span className="hero-pill">clear summaries</span>
                    <span className="hero-pill">strong citations</span>
                    <span className="hero-pill">less panic</span>
                  </div>
                </div>
              </header>

              <form id="ask-form">
                <textarea
                  id="query"
                  name="query"
                  rows={6}
                  placeholder="I received an eviction notice after requesting urgent repairs for mold and water damage."
                  required
                />
                <div className="actions">
                  <button type="submit" id="submit-btn">
                    Build My Case Strategy
                  </button>
                  <button type="button" id="sample-btn" className="secondary">
                    Try Sample Prompt
                  </button>
                </div>
              </form>
              <p id="status-text" className="status" aria-live="polite" />

              <section id="results" className="results hidden">
                <div className="result-head">
                  <h2>Case Output</h2>
                </div>
                <div className="result-meta">
                  <span id="result-counts" className="meta-pill">
                    0 sources
                  </span>
                </div>

                <div className="stack">
                  <article className="card emphasis">
                    <div className="card-head">
                      <h3>Case Snapshot</h3>
                      <button
                        type="button"
                        className="secondary copy-section-btn"
                        data-copy-target="case-snapshot"
                        data-copy-title="Case Snapshot"
                      >
                        Copy
                      </button>
                    </div>
                    <p id="explanation" />
                    <ul id="principles" />
                  </article>

                  <article className="card">
                    <div className="card-head">
                      <h3>Recommended Actions</h3>
                      <button
                        type="button"
                        className="secondary copy-section-btn"
                        data-copy-target="next-steps"
                        data-copy-title="Recommended Actions"
                      >
                        Copy
                      </button>
                    </div>
                    <ul id="next-steps" />
                  </article>

                  <article className="card">
                    <div className="card-head">
                      <h3>Evidence to Prepare</h3>
                      <button
                        type="button"
                        className="secondary copy-section-btn"
                        data-copy-target="checklist"
                        data-copy-title="Evidence to Prepare"
                      >
                        Copy
                      </button>
                    </div>
                    <ul id="checklist" />
                  </article>

                  <article className="card">
                    <div className="card-head">
                      <h3>Authorities to Reference</h3>
                      <button
                        type="button"
                        className="secondary copy-section-btn"
                        data-copy-target="authorities"
                        data-copy-title="Authorities to Reference"
                      >
                        Copy
                      </button>
                    </div>
                    <div id="authorities" />
                  </article>

                  <article className="card">
                    <div className="card-head">
                      <h3>Source Library</h3>
                      <button
                        type="button"
                        className="secondary copy-section-btn"
                        data-copy-target="sources"
                        data-copy-title="Source Library"
                      >
                        Copy
                      </button>
                    </div>
                    <div id="citations" />
                  </article>

                  <article className="card disclaimer">
                    <div className="card-head">
                      <h3>Disclaimer</h3>
                      <button
                        type="button"
                        className="secondary copy-section-btn"
                        data-copy-target="disclaimer"
                        data-copy-title="Disclaimer"
                      >
                        Copy
                      </button>
                    </div>
                    <p id="disclaimer" />
                  </article>
                </div>
              </section>
            </section>
          </main>
        </section>
      </div>
      <div id="action-bar" className="action-bar hidden">
        <p id="action-status">Ready to refine your case.</p>
        <div className="action-buttons">
          <button type="button" id="copy-checklist-btn" className="secondary">
            Copy Evidence Checklist
          </button>
          <button type="button" id="copy-next-steps-btn" className="secondary">
            Copy Next Steps
          </button>
          <button type="button" id="refine-btn">
            Refine My Question
          </button>
        </div>
      </div>
    </>
  );
}
