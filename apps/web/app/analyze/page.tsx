"use client";

import { useMemo, useState } from "react";
import AgentChat from "../components/AgentChat";

type Claim = {
  claim: string;
  source: string;
  url: string;
  country: string;
  year: number | null;
  evidence_type: string;
  confidence: string;
  challenged: boolean;
};

type Result = {
  policy: {
    country_name: string;
    magnitude_pct: number;
    implementation_year: number;
    assumptions: string[];
    missing_fields: string[];
    raw_text: string;
  };
  comparables: Array<{
    country_name: string;
    year: number;
    magnitude_pct: number;
    outcomes: Record<string, { change: number }>;
  }>;
  simulation: {
    draws: number;
    metrics: Record<string, { median: number; p05: number; p95: number; diff_vs_100: number }>;
    unintended: Array<{ outcome: string; note: string }>;
  };
  agents: Array<{ id: string; name: string; summary: string; claims: Claim[] }>;
  transcript: Array<{
    id: string;
    agent: string;
    name: string;
    text: string;
    evidence?: Claim | null;
  }>;
  debate: Array<{
    round: number;
    title: string;
    entries: Array<{ name: string; text: string }>;
  }>;
  synthesis: {
    banner: string;
    expected_benefit: number;
    unintended_risk: number;
    evidence_confidence: number;
    overall_risk: number;
    domain_scores: Record<string, number>;
    benefits: string[];
    costs: string[];
    disagreements: string[];
    alternative_policies: string[];
  };
};

const EXAMPLES = [
  "Increase the minimum wage by 15% in the United Kingdom starting in 2027.",
  "Raise the US federal minimum wage by 10% in 2028.",
  "Increase Canada’s minimum wage by 8% in 2027 with no youth exemption specified.",
];

export default function AnalyzePage() {
  const [text, setText] = useState(EXAMPLES[0]);
  const [coverage, setCoverage] = useState(100);
  const [compliance, setCompliance] = useState(85);
  const [macro, setMacro] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          coverage_pct: coverage,
          compliance_pct: compliance,
          macro,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Result;
      setResult(data);
      sessionStorage.setItem("policylens:last", JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const metrics = useMemo(() => result?.simulation.metrics ?? null, [result]);

  return (
    <main style={{ paddingTop: 32 }}>
      <div className="kicker" style={{ paddingTop: 28 }}>
        02 / Analyze
      </div>
      <h1>Analyze a minimum-wage proposal</h1>
      <p className="lede">
        Natural language in. Structured policy, comparable historical hikes, three-agent debate,
        and a Monte Carlo — using the local catalog built from public APIs.
      </p>

      <section className="composer">
        <div>
          <label htmlFor="policy">Policy text</label>
          <textarea id="policy" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} className="cta ghost" type="button" onClick={() => setText(ex)}>
                {ex.slice(0, 28)}…
              </button>
            ))}
          </div>
          <div className="grid-3" style={{ marginTop: 16 }}>
            <div>
              <label>Coverage {coverage}%</label>
              <input className="range" type="range" min={40} max={100} value={coverage} onChange={(e) => setCoverage(+e.target.value)} />
            </div>
            <div>
              <label>Compliance {compliance}%</label>
              <input className="range" type="range" min={40} max={100} value={compliance} onChange={(e) => setCompliance(+e.target.value)} />
            </div>
            <div>
              <label>Macro condition</label>
              <select value={macro} onChange={(e) => setMacro(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="recession">Recession</option>
                <option value="high_inflation">High inflation</option>
              </select>
            </div>
          </div>
          <button className="cta" type="button" onClick={run} disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Running deliberation…" : "Run analysis"}
          </button>
          {error && <p className="muted">{error}</p>}
        </div>
        <aside className="panel">
          <h2>Evidence stack</h2>
          <p className="muted">
            World Bank WDI (unemployment, inflation, Gini, GDP). ILOSTAT monthly minimum wage.
            FRED US federal hourly floor. Policy events are year-on-year ILO increases ≥ 8%.
          </p>
        </aside>
      </section>

      {result && (
        <section style={{ marginTop: 36 }}>
          <div className="banner">{result.synthesis.banner}</div>
          <p className="muted" style={{ marginTop: 12 }}>
            {result.policy.country_name} · {result.policy.magnitude_pct}% · {result.policy.implementation_year}
            {result.policy.missing_fields.length > 0
              ? ` · missing: ${result.policy.missing_fields.join(", ")}`
              : ""}
          </p>

          <h2 style={{ marginTop: 28 }}>The room</h2>
          <p className="muted">Agents post in turn. They are not a committee vote.</p>
          <AgentChat
            topic={`${result.policy.country_name.toLowerCase().replaceAll(" ", "-")}-${result.policy.implementation_year}`}
            messages={result.transcript}
          />

          <div className="scores">
            <div className="score">
              <span className="muted">Overall risk</span>
              <b>{result.synthesis.overall_risk}</b>
            </div>
            <div className="score">
              <span className="muted">Expected benefit</span>
              <b>{result.synthesis.expected_benefit}</b>
            </div>
            <div className="score">
              <span className="muted">Unintended risk</span>
              <b>{result.synthesis.unintended_risk}</b>
            </div>
            <div className="score">
              <span className="muted">Evidence confidence</span>
              <b>{result.synthesis.evidence_confidence}</b>
            </div>
          </div>

          <div className="grid-3">
            <div className="panel">
              <h2>Benefits</h2>
              {result.synthesis.benefits.map((b) => (
                <p key={b} className="muted">{b}</p>
              ))}
            </div>
            <div className="panel">
              <h2>Costs / side effects</h2>
              {result.synthesis.costs.map((b) => (
                <p key={b} className="muted">{b}</p>
              ))}
            </div>
            <div className="panel">
              <h2>Disagreements</h2>
              {result.synthesis.disagreements.map((b) => (
                <p key={b} className="muted">{b}</p>
              ))}
            </div>
          </div>

          {metrics && (
            <div style={{ marginTop: 24 }}>
              <h2>Simulation (index, baseline = 100)</h2>
              <p className="muted">{result.simulation.draws} draws. Median and 5–95 range.</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>p5</th>
                    <th>Median</th>
                    <th>p95</th>
                    <th>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics).map(([k, v]) => (
                    <tr key={k}>
                      <td>{k.replaceAll("_", " ")}</td>
                      <td>{v.p05}</td>
                      <td>{v.median}</td>
                      <td>{v.p95}</td>
                      <td>{v.diff_vs_100 > 0 ? "+" : ""}{v.diff_vs_100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 28 }}>
            <h2>Comparable historical hikes (≥8% YoY)</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Year</th>
                  <th>Magnitude</th>
                  <th>Unemployment Δ</th>
                  <th>Inflation Δ</th>
                </tr>
              </thead>
              <tbody>
                {result.comparables.map((ev) => (
                  <tr key={`${ev.country_name}-${ev.year}`}>
                    <td>{ev.country_name}</td>
                    <td>{ev.year}</td>
                    <td>+{ev.magnitude_pct}%</td>
                    <td>{ev.outcomes.unemployment_rate ? `${ev.outcomes.unemployment_rate.change} pp` : "—"}</td>
                    <td>{ev.outcomes.inflation ? `${ev.outcomes.inflation.change} pp` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 28 }}>
            <h2>What the system will not do</h2>
            <p className="muted">
              Alternatives to consider, not recommendations: {result.synthesis.alternative_policies.join(" ")}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
