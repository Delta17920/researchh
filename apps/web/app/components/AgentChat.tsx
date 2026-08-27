"use client";

import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  agent: string;
  name: string;
  text: string;
  evidence?: {
    source?: string;
    year?: number | null;
    evidence_type?: string;
    confidence?: string;
  } | null;
};

const AGENTS = [
  { id: "moderator", name: "Moderator", mark: "Md" },
  { id: "economic", name: "Economic", mark: "Ec" },
  { id: "social", name: "Social", mark: "So" },
  { id: "red_team", name: "Red Team", mark: "Rt" },
  { id: "synthesis", name: "Synthesis", mark: "Sy" },
];

function nextSpeaker(messages: ChatMessage[], shown: number): string | null {
  const upcoming = messages[shown];
  return upcoming ? upcoming.name : null;
}

export default function AgentChat({
  messages,
  topic,
}: {
  messages: ChatMessage[];
  topic: string;
}) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const runId = messages.map((m) => m.id).join("|");

  useEffect(() => {
    setShown(0);
    setTyping(true);
  }, [runId]);

  useEffect(() => {
    if (shown >= messages.length) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const delay = shown === 0 ? 400 : 850 + (messages[shown]?.text.length ?? 0) * 4;
    const t = window.setTimeout(() => {
      setShown((n) => n + 1);
    }, Math.min(delay, 2200));
    return () => window.clearTimeout(t);
  }, [shown, messages, runId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  const visible = messages.slice(0, shown);
  const speaker = nextSpeaker(messages, shown);
  const online = new Set(visible.map((m) => m.agent));
  if (speaker) {
    const live = AGENTS.find((a) => a.name === speaker);
    if (live) online.add(live.id);
  }

  return (
    <div className="chat-room">
      <aside className="chat-rail">
        <div className="chat-rail-title">In the room</div>
        {AGENTS.map((a) => (
          <div key={a.id} className={`chat-member ${online.has(a.id) ? "on" : ""}`}>
            <span className={`avatar ${a.id}`}>{a.mark}</span>
            <span>
              {a.name}
              <small>{online.has(a.id) ? " speaking" : " waiting"}</small>
            </span>
          </div>
        ))}
      </aside>
      <div className="chat-main">
        <div className="chat-head">
          <strong>#{topic}</strong>
          <span>{shown}/{messages.length} messages</span>
        </div>
        <div className="chat-scroll" ref={scroller}>
          {visible.map((m) => (
            <article key={m.id} className={`bubble agent-${m.agent}`}>
              <span className={`avatar ${m.agent}`}>
                {AGENTS.find((a) => a.id === m.agent)?.mark ?? m.name.slice(0, 2)}
              </span>
              <div>
                <header>
                  <b>{m.name}</b>
                  <span>{m.agent.replace("_", " ")}</span>
                </header>
                <p>{m.text}</p>
                {m.evidence?.source && (
                  <div className="cite">
                    {m.evidence.evidence_type ? `${m.evidence.evidence_type} · ` : ""}
                    {m.evidence.source}
                    {m.evidence.year ? ` · ${m.evidence.year}` : ""}
                  </div>
                )}
              </div>
            </article>
          ))}
          {typing && speaker && (
            <div className="typing">{speaker} is writing…</div>
          )}
        </div>
      </div>
    </div>
  );
}
