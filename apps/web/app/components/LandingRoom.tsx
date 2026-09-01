"use client";

import { useEffect, useState } from "react";

type Line = {
  agent: "economic" | "social" | "red_team" | "moderator";
  name: string;
  mark: string;
  text: string;
  to?: string;
};

const SCRIPT: Line[] = [
  {
    agent: "moderator",
    name: "Moderator",
    mark: "Md",
    text: "UK wage floor +15% in 2027. Argue. Do not vote to implement.",
  },
  {
    agent: "economic",
    name: "Economic",
    mark: "Ec",
    to: "Social",
    text: "Median draw: income +12.0, employment −1.1, prices +0.8. Labour-cost channel, not a slogan.",
  },
  {
    agent: "social",
    name: "Social",
    mark: "So",
    to: "Economic",
    text: "Averages hide incidence. The floor binds on low-wage staff. Youth take the hours cut.",
  },
  {
    agent: "red_team",
    name: "Red Team",
    mark: "Rt",
    to: "Economic",
    text: "Stop the consensus. 2008 US is GFC-contaminated. Same statute ≠ same outcome.",
  },
  {
    agent: "economic",
    name: "Economic",
    mark: "Ec",
    to: "Red Team",
    text: "Agreed on causation. I still will not drop SME profit −1.6 in the median draw.",
  },
  {
    agent: "social",
    name: "Social",
    mark: "So",
    to: "Red Team",
    text: "Then say it as incidence. If compliance is 85%, uncovered workers get nothing.",
  },
];

const STALLED = [
  { t: "One model. One essay.", s: true },
  { t: "Looks fine. Recommend +15%.", s: false },
  { t: "Any disagreement?", s: true },
  { t: "No — wrapping up.", s: false },
];

export default function LandingRoom() {
  const [step, setStep] = useState(0);
  const [stall, setStall] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setStep((n) => (n + 1) % SCRIPT.length);
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setStall((n) => (n + 1) % (STALLED.length + 2));
    }, 1600);
    return () => window.clearInterval(t);
  }, []);

  const live = SCRIPT[step];
  const shown = SCRIPT.slice(0, step + 1);
  const speaking = live.agent;

  return (
    <section className="compare" aria-label="How deliberation differs from a single agent">
      <div className="term">
        <div className="term-head">
          <span>A single LLM</span>
          <span className="pill pill-mute">Stops too early</span>
        </div>
        <div className="term-query">
          <span>Increase UK minimum wage 15%</span>
          <span className="status stalled">Stalled</span>
        </div>
        <div className="term-body">
          {STALLED.slice(0, Math.min(stall, STALLED.length)).map((row, i) => (
            <div key={i} className={`term-line ${row.s ? "ask" : ""}`}>
              {row.t}
            </div>
          ))}
        </div>
        <div className="term-foot">
          <span>1 answer · 0 challenges</span>
          <span>still not a deliberation</span>
        </div>
      </div>

      <div className="term term-live">
        <div className="term-head">
          <span>PolicyLens room</span>
          <span className="pill">Agents talking</span>
        </div>
        <div className="term-query">
          <span>Same proposal · three agents must disagree</span>
          <span className="status live">
            <i /> Deliberating
          </span>
        </div>

        <div className="room-stage">
          <svg className="room-edges" viewBox="0 0 320 200" aria-hidden>
            <line className={edgeOn(speaking, "economic", "social")} x1="60" y1="150" x2="160" y2="40" />
            <line className={edgeOn(speaking, "social", "red_team")} x1="160" y1="40" x2="260" y2="150" />
            <line className={edgeOn(speaking, "red_team", "economic")} x1="260" y1="150" x2="60" y2="150" />
          </svg>
          <div className={`node n-social ${speaking === "social" ? "hot" : ""}`}>
            <span className="avatar social">So</span>
            Social
          </div>
          <div className={`node n-econ ${speaking === "economic" ? "hot" : ""}`}>
            <span className="avatar economic">Ec</span>
            Economic
          </div>
          <div className={`node n-red ${speaking === "red_team" ? "hot" : ""}`}>
            <span className="avatar red_team">Rt</span>
            Red Team
          </div>
          <div className={`node n-mod ${speaking === "moderator" ? "hot" : ""}`}>
            <span className="avatar moderator">Md</span>
            Moderator
          </div>
        </div>

        <div className="speech" key={step}>
          <header>
            <b>{live.name}</b>
            {live.to ? <span>→ {live.to}</span> : <span>opens the room</span>}
          </header>
          <p>{live.text}</p>
        </div>

        <div className="term-log">
          {shown.slice(-3).map((m, i) => (
            <div key={`${m.agent}-${i}-${step}`} className="term-line">
              <em>{m.mark}</em> {m.text}
            </div>
          ))}
        </div>
        <div className="term-foot">
          <span>3 agents · 1 moderator · 0 implement votes</span>
          <span>{step + 1}/{SCRIPT.length}</span>
        </div>
      </div>
    </section>
  );
}

function edgeOn(speaker: string, a: string, b: string) {
  const on = speaker === a || speaker === b || speaker === "moderator";
  return on ? "edge on" : "edge";
}
