import Link from "next/link";
import LandingRoom from "./components/LandingRoom";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <div className="kicker">01 — Decision support · not a recommender</div>
          <h1>
            Agents that <em>disagree</em> before you decide.
          </h1>
        </div>
        <div className="hero-copy">
          <p className="lede">
            PolicyLens is a human–AI deliberation room. Economic, social, and red-team agents
            challenge one another on public data. A human still decides. The system will never
            tell you to implement the policy.
          </p>
          <div className="hero-actions">
            <Link className="cta" href="/analyze">
              Analyze a policy →
            </Link>
            <Link className="cta ghost" href="/simulation">
              Open simulator
            </Link>
          </div>
        </div>
      </section>

      <LandingRoom />

      <section className="modes">
        <div className="kicker">02 — What it is</div>
        <h2 className="section-title">A sidecar for policy judgment you do not babysit.</h2>
        <div className="mode-grid">
          <article className="panel">
            <h3>Agents drive the argument</h3>
            <ul className="checks">
              <li>Independent economic, social, and adversarial turns</li>
              <li>Claims tagged: direct, correlational, or model</li>
              <li>No committee vote. No implement recommendation</li>
            </ul>
          </article>
          <article className="panel">
            <h3>You drive the decision</h3>
            <ul className="checks">
              <li>Coverage, compliance, and macro are your knobs</li>
              <li>4,000-draw ranges instead of one fake forecast</li>
              <li>Final authority stays with the human</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="grid-3 stats-row">
        <div className="stat">
          <b>4</b>
          <span>Countries in the MVP catalog</span>
        </div>
        <div className="stat">
          <b>3</b>
          <span>Agents that must disagree in public</span>
        </div>
        <div className="stat">
          <b>0</b>
          <span>Automatic implement / reject decisions</span>
        </div>
      </section>
    </main>
  );
}
