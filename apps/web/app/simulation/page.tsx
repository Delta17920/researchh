"use client";

import { useState } from "react";

type Sim = {
  draws: number;
  metrics: Record<string, { median: number; p05: number; p95: number; diff_vs_100: number }>;
  unintended: Array<{ outcome: string; note: string }>;
};

export default function SimulationPage() {
  const [country, setCountry] = useState("GBR");
  const [magnitude, setMagnitude] = useState(15);
  const [coverage, setCoverage] = useState(100);
  const [compliance, setCompliance] = useState(85);
  const [macro, setMacro] = useState("normal");
  const [sim, setSim] = useState<Sim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          magnitude_pct: magnitude,
          coverage_pct: coverage,
          compliance_pct: compliance,
          macro,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSim((await res.json()) as Sim);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ paddingTop: 32 }}>
      <div className="kicker">Counterfactual layer</div>
      <h1>Scenario simulator</h1>
      <p className="lede">
        Change magnitude, coverage, compliance, and the macro regime. This re-runs the numeric
        engine only — not a new LLM essay. Baseline index = 100.
      </p>
      <div className="grid-3" style={{ marginTop: 20 }}>
        <div>
          <label>Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="GBR">United Kingdom</option>
            <option value="USA">United States</option>
            <option value="CAN">Canada</option>
            <option value="AUS">Australia</option>
          </select>
        </div>
        <div>
          <label>Magnitude {magnitude}%</label>
          <input className="range" type="range" min={3} max={30} value={magnitude} onChange={(e) => setMagnitude(+e.target.value)} />
        </div>
        <div>
          <label>Macro</label>
          <select value={macro} onChange={(e) => setMacro(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="recession">Recession</option>
            <option value="high_inflation">High inflation</option>
          </select>
        </div>
        <div>
          <label>Coverage {coverage}%</label>
          <input className="range" type="range" min={40} max={100} value={coverage} onChange={(e) => setCoverage(+e.target.value)} />
        </div>
        <div>
          <label>Compliance {compliance}%</label>
          <input className="range" type="range" min={40} max={100} value={compliance} onChange={(e) => setCompliance(+e.target.value)} />
        </div>
      </div>
      <button className="cta" type="button" onClick={run} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? "Sampling…" : "Run 4,000 draws"}
      </button>
      {error && <p className="muted">{error}</p>}
      {sim && (
        <section style={{ marginTop: 24 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>p5</th>
                <th>Median</th>
                <th>p95</th>
                <th>Δ vs baseline</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sim.metrics).map(([k, v]) => (
                <tr key={k}>
                  <td>{k.replaceAll("_", " ")}</td>
                  <td>{v.p05}</td>
                  <td>{v.median}</td>
                  <td>{v.p95}</td>
                  <td>
                    {v.diff_vs_100 > 0 ? "+" : ""}
                    {v.diff_vs_100}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            {sim.unintended.map((u) => (
              <p key={u.outcome} className="muted">
                Unintended: {u.outcome} — {u.note}
              </p>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
