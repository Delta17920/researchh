import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <div className="kicker">Decision support · not a recommender</div>
          <h1>What happens if this policy is implemented?</h1>
          <p className="lede">
            PolicyLens runs a structured argument between economic, social, and adversarial
            agents, grounded in World Bank indicators and ILO statutory minimum-wage history.
            A human still decides. The system will not tell you to implement the policy.
          </p>
          <Link className="cta" href="/analyze">
            Analyze a policy
          </Link>
          <Link className="cta ghost" href="/simulation">
            Open simulator
          </Link>
        </div>
        <aside className="panel">
          <h2>First working slice</h2>
          <ol>
            <li>Domain: minimum wage only</li>
            <li>Countries: US, UK, Canada, Australia</li>
            <li>Data: World Bank WDI + ILOSTAT + FRED</li>
            <li>Agents: Economic, Social, Red-team</li>
            <li>Output: evidence, disagreement, Monte Carlo tails</li>
          </ol>
        </aside>
      </section>
      <section className="grid-3">
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
