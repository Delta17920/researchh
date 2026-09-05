"use client";

import { useEffect, useState } from "react";
import { AgentMap, SCRIPT } from "./LandingRoom";

const CLAIMS = [
  {
    role: "Economic",
    title: "Claim",
    body: "A 15% wage floor, after coverage and compliance, moves worker income up and employment slightly down in the median draw. That is a labour-cost channel, not a forecast.",
    tag: "Model",
  },
  {
    role: "Social",
    title: "Counterpoint",
    body: "Averages hide incidence. The floor binds on low-wage staff. If firms cut hours, young workers take the hit while the income index still looks up.",
    tag: "Direct",
  },
  {
    role: "Red Team",
    title: "Failure mode",
    body: "Several historical analogues sit on COVID reopenings and the GFC. Same statute name does not mean the same outcome transfers to 2027.",
    tag: "Correlational",
  },
];

export default function LiveDebatePreview() {
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(1);

  useEffect(() => {
    const t = window.setInterval(() => {
      setStep((n) => (n + 1) % SCRIPT.length);
      setShown((n) => (n >= CLAIMS.length ? 1 : n + 1));
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  const live = SCRIPT[step];

  return (
    <div className="debate-grid">
      <div className="transcript-card">
        {CLAIMS.slice(0, shown).map((c) => (
          <article key={c.role} className="claim-row">
            <span className="claim-role">{c.role}</span>
            <div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <span className="tag">{c.tag}</span>
            </div>
          </article>
        ))}
        <div className="typing-line">
          {live.name} is formulating the next response
          <span className="ellipsis">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>

      <div className="debate-side">
        <div className="term term-live debate-map">
          <div className="term-query">
            <span>Agent perspectives</span>
            <span className="status live">
              <i /> Live
            </span>
          </div>
          <AgentMap speaking={live.agent} />
        </div>
        <div className="metric-cards">
          <div className="metric-card">
            <header>
              <span>Evidence coverage</span>
              <b>50%</b>
            </header>
            <div className="bar">
              <span style={{ width: "50%" }} />
            </div>
          </div>
          <div className="metric-card">
            <header>
              <span>Unresolved conflicts</span>
              <b>03</b>
            </header>
            <p className="metric-big">3</p>
          </div>
          <div className="mini-row">
            <div className="mini">
              <span>Employment</span>
              <b>medium risk</b>
            </div>
            <div className="mini">
              <span>Inflation</span>
              <b>low–medium</b>
            </div>
            <div className="mini">
              <span>Equity</span>
              <b>positive</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
