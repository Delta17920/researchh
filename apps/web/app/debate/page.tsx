"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AgentChat, { type ChatMessage } from "../components/AgentChat";

type Stored = {
  transcript?: ChatMessage[];
  debate?: Array<{
    round: number;
    title: string;
    entries: Array<{ agent: string; name: string; text: string }>;
  }>;
  policy: { country_name: string; magnitude_pct: number; implementation_year?: number };
};

function fallbackTranscript(data: Stored): ChatMessage[] {
  if (data.transcript?.length) return data.transcript;
  const msgs: ChatMessage[] = [];
  for (const round of data.debate ?? []) {
    for (const e of round.entries) {
      msgs.push({
        id: `${round.round}-${e.name}-${msgs.length}`,
        agent: e.agent,
        name: e.name,
        text: e.text,
      });
    }
  }
  return msgs;
}

export default function DebatePage() {
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("policylens:last");
    if (raw) setData(JSON.parse(raw) as Stored);
  }, []);

  if (!data) {
    return (
      <main style={{ paddingTop: 32 }}>
        <h1>Debate room</h1>
        <p className="lede">Run an analysis first. The agents post here in order, like a working group chat.</p>
        <Link className="cta" href="/analyze">
          Go to analyze
        </Link>
      </main>
    );
  }

  const messages = fallbackTranscript(data);
  const topic = `${data.policy.country_name.toLowerCase().replaceAll(" ", "-")}-wage`;

  return (
    <main style={{ paddingTop: 32 }}>
      <div className="kicker">Working group · live transcript</div>
      <h1>
        {data.policy.country_name} +{data.policy.magnitude_pct}%
      </h1>
      <p className="lede">
        Moderator, Economic, Social, and Red Team take turns. Synthesis closes. Nobody in the room
        is allowed to recommend implementation.
      </p>
      <AgentChat topic={topic} messages={messages} />
    </main>
  );
}
