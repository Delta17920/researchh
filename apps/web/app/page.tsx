import Link from "next/link";
import LandingRoom from "./components/LandingRoom";
import LiveDebatePreview from "./components/LiveDebatePreview";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <div className="kicker">Multi-agent policy intelligence</div>
          <h1>
            Agents that <em>disagree</em> before you decide.
          </h1>
          <p className="lede">
            Independent economic, social, and red-team agents challenge a proposal on public
            data. A human still decides. The system will never tell you to implement the policy.
          </p>
          <div className="hero-actions">
            <Link className="cta" href="/analyze">
              Analyze a policy →
            </Link>
            <Link className="cta ghost" href="#live-debate">
              Watch the debate
            </Link>
          </div>
          <ul className="benefits">
            <li>Evidence-first</li>
            <li>Adversarial by design</li>
            <li>Human in control</li>
          </ul>
        </div>
        <LandingRoom />
      </section>

      <section className="ribbon" aria-label="Product facts">
        <div>
          <b>3 + 1</b>
          <span>AI agents — independent perspectives</span>
        </div>
        <div>
          <b>3</b>
          <span>Claim types — direct · correlational · model</span>
        </div>
        <div>
          <b>100%</b>
          <span>Human control — no auto implementation</span>
        </div>
        <div>
          <b>0</b>
          <span>Implement votes — clarity over certainty</span>
        </div>
      </section>

      <section id="live-debate" className="block">
        <div className="block-head">
          <div>
            <div className="kicker">01 / Live debate</div>
            <h2 className="ghost-title">Make disagreement visible.</h2>
          </div>
          <p className="lede">
            The debate is the product signature. Present it like a structured research
            transcript rather than a generic chat.
          </p>
        </div>
        <LiveDebatePreview />
      </section>

      <section className="block" id="workflow">
        <div className="block-head">
          <div>
            <div className="kicker">02 / Workflow</div>
            <h2 className="ghost-title">Analyze. Debate. Simulate.</h2>
          </div>
          <p className="lede">Three modes, one visual system. No separate mini-products competing for attention.</p>
        </div>
        <div className="workflow">
          <article>
            <span>01</span>
            <h3>Analyze</h3>
            <p>Extract assumptions, missing exemptions, claims, evidence gaps, and comparable wage-floor events.</p>
            <Link href="/analyze">Open analysis →</Link>
          </article>
          <article>
            <span>02</span>
            <h3>Debate</h3>
            <p>Let independent agents challenge the proposal using different objectives and failure models.</p>
            <Link href="/debate">Start debate →</Link>
          </article>
          <article>
            <span>03</span>
            <h3>Simulate</h3>
            <p>Adjust coverage, compliance, and macro. Compare scenarios without pretending the model knows the future.</p>
            <Link href="/simulation">Run scenario →</Link>
          </article>
        </div>
      </section>

      <section className="block" id="sim-preview">
        <div className="block-head">
          <div>
            <div className="kicker">03 / Simulation</div>
            <h2 className="ghost-title">Explore outcomes, not predictions.</h2>
          </div>
          <p className="lede">
            The simulation stays visually restrained so uncertainty and assumptions remain visible.
          </p>
        </div>
        <div className="sim-preview">
          <div className="chart-card">
            <header>
              <span>Scenario comparison</span>
              <span>Index · baseline = 100</span>
            </header>
            <h3>Employment sensitivity</h3>
            <svg className="spark" viewBox="0 0 560 180" role="img" aria-label="Illustrative employment paths">
              <polyline className="line base" points="20,90 120,88 220,92 320,90 420,91 540,89" fill="none" />
              <polyline className="line adapt" points="20,90 120,102 220,108 320,112 420,110 540,109" fill="none" />
              <polyline className="line cons" points="20,90 120,98 220,118 320,124 420,122 540,120" fill="none" />
            </svg>
            <div className="legend">
              <span>
                <i className="base" /> Baseline
              </span>
              <span>
                <i className="adapt" /> Policy median
              </span>
              <span>
                <i className="cons" /> Conservative tail
              </span>
            </div>
          </div>
          <aside>
            <div className="assume">
              <h4>Assumption A</h4>
              <p>Hiring response is treated as elasticity noise plus a thin historical prior — not a uniform law.</p>
            </div>
            <div className="assume">
              <h4>Assumption B</h4>
              <p>Policy compliance is modeled separately from headline coverage.</p>
            </div>
            <div className="assume">
              <h4>Uncertainty</h4>
              <p>Bands communicate spread across 4,000 draws instead of implying a single forecast.</p>
            </div>
            <Link className="cta" href="/simulation">
              Open simulator →
            </Link>
          </aside>
        </div>
      </section>

      <section className="block" id="about">
        <div className="kicker">About</div>
        <h2 className="ghost-title">A deliberation room, not a recommender.</h2>
        <p className="lede">
          MVP domain: statutory minimum wage in the United States, United Kingdom, Canada, and
          Australia. Data from World Bank WDI, ILOSTAT, and FRED. Final authority stays human.
        </p>
      </section>
    </main>
  );
}
