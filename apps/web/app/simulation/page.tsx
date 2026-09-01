"use client";

import { useEffect, useState } from "react";

type Sim = {
  draws: number;
  effective_magnitude_pct?: number;
  macro?: string;
  metrics: Record<string, { median: number; p05: number; p95: number; diff_vs_100: number }>;
  unintended: Array<{ outcome: string; note: string }>;
};

const LOG = [
  "Loading country snapshot",
  "Matching ILO wage-floor events ≥ 8%",
  "Blending historical employment prior",
  "Sampling 4,000 Monte Carlo draws",
  "Scoring unintended-consequence thresholds",
];

export default function SimulationPage() {
  const [country, setCountry] = useState("GBR");
  const [magnitude, setMagnitude] = useState(15);
  const [coverage, setCoverage] = useState(100);
  const [compliance, setCompliance] = useState(85);
  const [macro, setMacro] = useState("normal");
  const [sim, setSim] = useState<Sim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logStep, setLogStep] = useState(0);
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setLogStep(0);
    const t = window.setInterval(() => {
      setLogStep((n) => Math.min(n + 1, LOG.length));
    }, 280);
    return () => window.clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!sim) return;
    setReveal(0);
    const keys = Object.keys(sim.metrics);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setReveal(i);
      if (i >= keys.length) window.clearInterval(t);
    }, 90);
    return () => window.clearInterval(t);
  }, [sim]);

  async function run() {
    setLoading(true);
    setError(null);
    setSim(null);
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
      const data = (await res.json()) as Sim;
      await new Promise((r) => setTimeout(r, 900));
      setSim(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  const entries = sim ? Object.entries(sim.metrics) : [];
  const lo = entries.length ? Math.min(...entries.map(([, v]) => v.p05), 100) - 1 : 96;
  const hi = entries.length ? Math.max(...entries.map(([, v]) => v.p95), 100) + 1 : 114;

  return (
    <main className="sim-page">
      <div className="kicker">03 — Counterfactual layer</div>
      <h1>Scenario simulator</h1>
      <p className="lede">
        Change magnitude, coverage, compliance, and the macro regime. This re-runs the numeric
        engine only — not a new essay. Baseline index = 100.
      </p>

      <div className="sim-board">
        <div className="sim-controls">
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
          <button className="cta" type="button" onClick={run} disabled={loading}>
            {loading ? "Sampling…" : "Run 4,000 draws"}
          </button>
        </div>

        <div className="sim-stage">
          {loading && (
            <div className="run-log" aria-live="polite">
              <div className="term-query">
                <span>Monte Carlo · {country} · {magnitude}%</span>
                <span className="status live">
                  <i /> Running
                </span>
              </div>
              {LOG.slice(0, logStep).map((line) => (
                <div key={line} className="term-line">
                  {line}
                </div>
              ))}
              <div className="progress">
                <span style={{ width: `${Math.min(100, (logStep / LOG.length) * 100)}%` }} />
              </div>
            </div>
          )}

          {error && <p className="muted">{error}</p>}

          {!loading && !sim && !error && (
            <div className="sim-idle">
              <p>Set the knobs. Run draws. Watch the distribution land — not a single forecast.</p>
            </div>
          )}

          {sim && !loading && (
            <div className="sim-results">
              <div className="term-query">
                <span>{sim.draws} draws · effective {sim.effective_magnitude_pct ?? "—"}%</span>
                <span className="status done">Settled</span>
              </div>
              {entries.slice(0, reveal).map(([k, v]) => (
                <div key={k} className="metric-row">
                  <div className="metric-head">
                    <span>{k.replaceAll("_", " ")}</span>
                    <b className={v.diff_vs_100 >= 0 ? "up" : "down"}>
                      {v.diff_vs_100 > 0 ? "+" : ""}
                      {v.diff_vs_100}
                    </b>
                  </div>
                  <div className="range-track">
                    <span className="base" style={{ left: `${pct(100, lo, hi)}%` }} />
                    <span
                      className="band"
                      style={{
                        left: `${pct(v.p05, lo, hi)}%`,
                        width: `${Math.max(2, pct(v.p95, lo, hi) - pct(v.p05, lo, hi))}%`,
                      }}
                    />
                    <span className="tick" style={{ left: `${pct(v.median, lo, hi)}%` }} />
                  </div>
                  <div className="metric-meta">
                    <span>p5 {v.p05}</span>
                    <span>median {v.median}</span>
                    <span>p95 {v.p95}</span>
                  </div>
                </div>
              ))}
              {sim.unintended.length > 0 && reveal >= entries.length && (
                <div className="unintended-list">
                  {sim.unintended.map((u) => (
                    <p key={u.outcome}>
                      <strong>Unintended</strong> {u.outcome} — {u.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function pct(v: number, lo: number, hi: number) {
  return ((v - lo) / (hi - lo)) * 100;
}
