import { completeJson, llmConfigured, llmModel, type ChatTurn } from "./llm";
import type { PolicyVector } from "./engine";

type Sim = {
  draws: number;
  macro: string;
  metrics: Record<string, { median: number; p05: number; p95: number; diff_vs_100: number }>;
  baseline_indicators: Record<string, { value: number; year: number } | undefined>;
  unintended: Array<{ outcome: string; note: string }>;
  historical_priors: { n_comparables: number };
};

type Comparable = {
  country: string;
  country_name: string;
  year: number;
  magnitude_pct: number;
  outcomes: Record<string, { change: number }>;
};

export type Deliberation = {
  policy: PolicyVector;
  comparables: Comparable[];
  simulation: Sim;
  agents: Array<{ id: string; name: string; stance?: string; summary: string; claims: unknown[] }>;
  debate: Array<{ round: number; title: string; entries: Array<{ agent: string; name: string; text: string }> }>;
  transcript: Array<{
    id?: string;
    seq?: number;
    agent: string;
    name: string;
    text: string;
    evidence?: {
      claim?: string;
      source: string;
      url?: string;
      country?: string;
      year?: number | null;
      evidence_type: string;
      confidence: string;
      challenged?: boolean;
    } | null;
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
    does_not_recommend?: boolean;
  };
  sources: Record<string, { name?: string; url?: string }>;
  agent_mode?: "scripted" | "live";
  agent_model?: string;
  agent_fallback_reason?: string;
};

const RULES = `You are one specialist in PolicyLens, a human-AI room for FINANCIAL / FISCAL policy only
(wage floors, taxes, subsidies, transfers, carbon tax, credit/capital rules).
Ignore education, immigration, and health-system design.

Hard rules:
- Do not recommend implementing or rejecting the policy.
- Do not invent statistics. You may only use numbers that appear in CONTEXT.
- If you speculate, set evidence_type to llm_reasoning and confidence to low.
- Speak as a person in a working-group chat: 3–6 sentences, direct, no bullet dump, no markdown headings.
- Reply with JSON only: {"text":"...","evidence_type":"direct|correlational|model|llm_reasoning","source":"...","confidence":"high|medium|low"}`;

const PROMPTS: Record<string, string> = {
  economic: `${RULES}

You are Economic. Job: labour cost, employment, inflation, SME margins, fiscal cost of a wage/tax shock.
Use the Monte Carlo medians and tails from CONTEXT. Say they are model inference, not a single forecast.
Do not flatten incidence into one GDP slogan.`,
  social: `${RULES}

You are Social. Job: who gains and who loses — low-wage workers, youth, uncovered workers, households vs firms.
Challenge averages. Ask whether coverage and compliance mean the headline rate actually lands.`,
  red_team: `${RULES}

You are Red Team. Job: disagreement and failure discovery. Attack bad historical analogues (crisis years, COVID reopenings),
missing youth/SME exemptions, treating correlation as causation, and false precision.
You are not allowed to agree for politeness.`,
  moderator: `${RULES}

You are Moderator. Job: open or close the room. Name open disagreements. Remind everyone there is no implement vote.
Do not take a side on the economics.`,
};

function contextPack(base: Deliberation) {
  const m = base.simulation.metrics;
  return {
    policy: {
      text: base.policy.raw_text,
      country: base.policy.country_name,
      magnitude_pct: base.policy.magnitude_pct,
      year: base.policy.implementation_year,
      coverage_pct: base.policy.coverage_pct,
      compliance_pct: base.policy.compliance_pct,
      missing_fields: base.policy.missing_fields,
      assumptions: base.policy.assumptions,
    },
    baseline: base.simulation.baseline_indicators,
    monte_carlo: {
      draws: base.simulation.draws,
      macro: base.simulation.macro,
      worker_income: m.worker_income,
      employment: m.employment,
      consumer_prices: m.consumer_prices,
      sme_profit: m.sme_profit,
      poverty: m.poverty,
    },
    comparables: base.comparables.slice(0, 6).map((c) => ({
      country: c.country_name,
      year: c.year,
      magnitude_pct: c.magnitude_pct,
      unemployment_change_pp: c.outcomes.unemployment_rate?.change ?? null,
      inflation_change_pp: c.outcomes.inflation?.change ?? null,
    })),
    unintended: base.simulation.unintended,
    scores: {
      expected_benefit: base.synthesis.expected_benefit,
      unintended_risk: base.synthesis.unintended_risk,
      evidence_confidence: base.synthesis.evidence_confidence,
    },
  };
}

function userBrief(role: string, task: string, pack: unknown, prior: string) {
  return `ROLE: ${role}
TASK: ${task}

CONTEXT (only legal numbers):
${JSON.stringify(pack)}

PRIOR TURNS:
${prior || "(none yet — independent analysis)"}

Return JSON only.`;
}

function asEvidence(turn: ChatTurn, country: string, year: number) {
  return {
    claim: turn.text,
    source: turn.source,
    url: "",
    country,
    year,
    evidence_type: turn.evidence_type,
    confidence: turn.confidence,
    challenged: turn.evidence_type === "llm_reasoning" || turn.confidence === "low",
  };
}

function bubble(
  agent: string,
  name: string,
  turn: ChatTurn,
  policy: PolicyVector,
) {
  return {
    agent,
    name,
    text: turn.text,
    evidence: asEvidence(turn, policy.country, policy.implementation_year),
  };
}

function debateFrom(transcript: Deliberation["transcript"]) {
  const buckets: Array<[string, string[]]> = [
    ["Opening", ["moderator", "economic"]],
    ["Challenge", ["social", "red_team"]],
    ["Rebuttal", ["economic", "social", "red_team"]],
    ["Close", ["moderator", "synthesis"]],
  ];
  return buckets.map(([title, ids], round) => ({
    round: round + 1,
    title,
    entries: transcript
      .filter((m) => ids.includes(m.agent))
      .map((m) => ({ agent: m.agent, name: m.name, text: m.text })),
  }));
}

export async function runLiveAgents(base: Deliberation): Promise<Deliberation> {
  if (!llmConfigured()) {
    return { ...base, agent_mode: "scripted" };
  }
  const pack = contextPack(base);
  const p = base.policy;

  const opener: ChatTurn = {
    text: `Room is open. On the table: a financial-policy shock — ${p.country_name} wage floor ${p.magnitude_pct}% in ${p.implementation_year}, coverage ${p.coverage_pct}%, compliance ${p.compliance_pct}%, macro ${base.simulation.macro}. We argue from the context pack. We do not vote to implement. Economic, then Social — independent first.`,
    evidence_type: "llm_reasoning",
    source: "Moderator protocol",
    confidence: "high",
  };

  const [econ1, social1] = await Promise.all([
    completeJson(PROMPTS.economic, userBrief("Economic", "Independent analysis of this financial shock. Cite Monte Carlo and the closest comparable.", pack, "")),
    completeJson(PROMPTS.social, userBrief("Social", "Independent analysis. Who gains and who loses if coverage/compliance are incomplete?", pack, "")),
  ]);

  const prior1 = `Economic: ${econ1.text}\nSocial: ${social1.text}`;
  const [econ2, social2] = await Promise.all([
    completeJson(PROMPTS.economic, userBrief("Economic", "Challenge Social. One concrete weakness in their incidence story. Stay inside CONTEXT numbers.", pack, prior1)),
    completeJson(PROMPTS.social, userBrief("Social", "Challenge Economic. Averages vs who actually receives the raise. Stay inside CONTEXT.", pack, prior1)),
  ]);

  const prior2 = `${prior1}\nEconomic (challenge): ${econ2.text}\nSocial (challenge): ${social2.text}`;
  const red = await completeJson(
    PROMPTS.red_team,
    userBrief("Red Team", "Attack the emerging consensus. Bad analogues, missing exemptions, false precision. Do not agree.", pack, prior2),
  );

  const close = await completeJson(
    PROMPTS.moderator,
    userBrief(
      "Moderator",
      "Close the room. List 2–3 unresolved disagreements. Repeat: no implement vote. Mention the numeric scores from CONTEXT without adding new ones.",
      pack,
      `${prior2}\nRed Team: ${red.text}`,
    ),
  );

  const synthesisTurn: ChatTurn = {
    text: `Expected benefit ${base.synthesis.expected_benefit}/100, unintended risk ${base.synthesis.unintended_risk}/100, evidence confidence ${base.synthesis.evidence_confidence}/100. ${base.synthesis.benefits[0]} ${base.synthesis.costs[0]} Alternatives: ${base.synthesis.alternative_policies[0]} Final decision stays human.`,
    evidence_type: "model",
    source: "PolicyLens synthesis layer",
    confidence: "medium",
  };

  const room = [
    bubble("moderator", "Moderator", opener, p),
    bubble("economic", "Economic", econ1, p),
    bubble("social", "Social", social1, p),
    bubble("economic", "Economic", econ2, p),
    bubble("social", "Social", social2, p),
    bubble("red_team", "Red Team", red, p),
    bubble("moderator", "Moderator", close, p),
    bubble("synthesis", "Synthesis", synthesisTurn, p),
  ].map((m, i) => ({ ...m, id: `m${i + 1}`, seq: i + 1 }));

  const agents = base.agents.map((a) => {
    if (a.id === "economic") return { ...a, summary: econ1.text };
    if (a.id === "social") return { ...a, summary: social1.text };
    if (a.id === "red_team") return { ...a, summary: red.text };
    return a;
  });

  return {
    ...base,
    agents,
    transcript: room,
    debate: debateFrom(room),
    agent_mode: "live",
    agent_model: llmModel(),
  };
}

export { llmConfigured, llmModel };
