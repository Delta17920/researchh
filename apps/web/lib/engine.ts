export type CountryCode = "USA" | "GBR" | "CAN" | "AUS";

export type PolicyVector = {
  raw_text: string;
  country: CountryCode;
  country_name: string;
  domain: string;
  magnitude_pct: number;
  implementation_year: number;
  duration: string;
  target_groups: string[];
  primary_objective: string;
  exemptions: string[];
  coverage_pct: number;
  compliance_pct: number;
  assumptions: string[];
  missing_fields: string[];
};

export type Indicator = { value: number; year: number };
export type PolicyEvent = {
  country: string;
  country_name: string;
  year: number;
  magnitude_pct: number;
  outcomes: Record<string, { change: number; before?: number; after?: number }>;
};

type Catalog = {
  countries: Record<string, string>;
  sources: Record<string, { name: string; url: string }>;
  snapshot: Record<string, { name: string; indicators: Record<string, Indicator> }>;
  policy_events: PolicyEvent[];
  fetched_note?: string;
};

import rawCatalog from "../data/catalog.json";

const catalog = rawCatalog as Catalog;

export function loadCatalog() {
  return catalog;
}

export function snapshot(country: string) {
  return catalog.snapshot[country] ?? { name: country, indicators: {} };
}

export function eventsFor(country?: string | null, limit = 40) {
  let events = catalog.policy_events;
  if (country) events = events.filter((e) => e.country === country);
  return events.slice(0, limit);
}

export function comparableEvents(country: string, magnitudePct: number, k = 6) {
  const scored = catalog.policy_events.map((ev) => {
    const magGap = Math.abs(ev.magnitude_pct - magnitudePct);
    const countryBonus = ev.country === country ? 0 : 8;
    const recency = Math.max(0, 2026 - ev.year) * 0.15;
    return { score: magGap + countryBonus + recency, ev };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, k).map((s) => s.ev);
}

const COUNTRY_ALIASES: Array<[string, CountryCode]> = [
  ["united kingdom", "GBR"],
  ["great britain", "GBR"],
  ["united states", "USA"],
  ["australia", "AUS"],
  ["australian", "AUS"],
  ["america", "USA"],
  ["britain", "GBR"],
  ["england", "GBR"],
  ["canada", "CAN"],
  ["u.k.", "GBR"],
  ["usa", "USA"],
  ["uk", "GBR"],
  ["us", "USA"],
];

const COUNTRY_NAMES: Record<CountryCode, string> = {
  USA: "United States",
  GBR: "United Kingdom",
  CAN: "Canada",
  AUS: "Australia",
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number, mean: number, sd: number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function median(values: number[]) {
  const o = [...values].sort((a, b) => a - b);
  const mid = Math.floor(o.length / 2);
  return o.length % 2 ? o[mid] : (o[mid - 1] + o[mid]) / 2;
}

function signed(n: number, digits = 1) {
  const v = n.toFixed(digits);
  return n > 0 ? `+${v}` : v;
}

export function structurePolicy(text: string): PolicyVector {
  const lowered = text.toLowerCase();
  const missing: string[] = [];
  const assumptions: string[] = [];

  let country: CountryCode | undefined;
  for (const [alias, code] of COUNTRY_ALIASES) {
    const re = new RegExp(`\\b${alias.replace(".", "\\.")}\\b`);
    if (re.test(lowered)) {
      country = code;
      break;
    }
  }
  if (!country) {
    country = "GBR";
    missing.push("country");
    assumptions.push("Country defaulted to United Kingdom.");
  }

  let mag: number | undefined;
  const m1 = lowered.match(/(\d+(?:\.\d+)?)\s*%/);
  const m2 = lowered.match(/by\s+(\d+(?:\.\d+)?)\s*(percent|per cent)/);
  if (m1) mag = Number(m1[1]);
  else if (m2) mag = Number(m2[1]);
  if (mag === undefined) {
    mag = 15;
    missing.push("magnitude");
    assumptions.push("Magnitude defaulted to +15%.");
  }

  const y = text.match(/\b(20[2-3][0-9])\b/);
  let year = y ? Number(y[1]) : undefined;
  if (!year) {
    year = 2027;
    missing.push("implementation_year");
    assumptions.push("Implementation year defaulted to 2027.");
  }

  if (!/minimum wage|min wage|living wage|wage floor|hourly wage/.test(lowered)) {
    assumptions.push("Interpreted as a minimum-wage policy (MVP domain).");
  }

  const exemptions: string[] = [];
  if (/youth|under[- ]18|young worker/.test(lowered)) exemptions.push("youth rates mentioned");
  else {
    missing.push("youth_exemption");
    assumptions.push("Youth/apprentice exemptions were not specified.");
  }
  if (/small (firm|business)|sme/.test(lowered)) exemptions.push("small-business mention");
  else missing.push("small_business_exemption");

  return {
    raw_text: text.trim(),
    country,
    country_name: COUNTRY_NAMES[country],
    domain: "minimum_wage",
    magnitude_pct: mag,
    implementation_year: year,
    duration: "permanent",
    target_groups: ["low-wage workers"],
    primary_objective: "Increase worker income",
    exemptions,
    coverage_pct: 100,
    compliance_pct: 85,
    assumptions,
    missing_fields: missing,
  };
}

function histMean(events: PolicyEvent[], metric: string) {
  const vals = events
    .map((ev) => ev.outcomes?.[metric]?.change)
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function summarize(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  const n = ordered.length;
  const p = (q: number) => ordered[Math.min(n - 1, Math.floor(q * (n - 1)))];
  const med = median(ordered);
  return {
    p05: Number(p(0.05).toFixed(2)),
    p25: Number(p(0.25).toFixed(2)),
    median: Number(med.toFixed(2)),
    p75: Number(p(0.75).toFixed(2)),
    p95: Number(p(0.95).toFixed(2)),
    diff_vs_100: Number((med - 100).toFixed(2)),
  };
}

export function simulate(opts: {
  country: string;
  magnitude_pct: number;
  coverage_pct?: number;
  compliance_pct?: number;
  macro?: string;
  draws?: number;
  seed?: number;
}) {
  const coverage_pct = opts.coverage_pct ?? 100;
  const compliance_pct = opts.compliance_pct ?? 85;
  const macro = opts.macro ?? "normal";
  const draws = opts.draws ?? 4000;
  const seed = opts.seed ?? 7;
  const shock = ({ normal: 1, recession: 1.45, high_inflation: 1.25 } as Record<string, number>)[macro] ?? 1;
  const macroSeed = ({ normal: 0, recession: 11, high_inflation: 23 } as Record<string, number>)[macro] ?? 0;
  const rng = mulberry32(seed + Math.floor(opts.magnitude_pct * 10) + coverage_pct + compliance_pct + macroSeed);
  const effective = opts.magnitude_pct * (coverage_pct / 100) * (compliance_pct / 100);
  const comps = comparableEvents(opts.country, opts.magnitude_pct);
  const empHist = histMean(comps, "unemployment_rate");
  const infHist = histMean(comps, "inflation");
  const snap = snapshot(opts.country).indicators;

  const samples: Record<string, number[]> = {
    worker_income: [],
    employment: [],
    consumer_prices: [],
    sme_profit: [],
    poverty: [],
    government_revenue: [],
  };

  for (let i = 0; i < draws; i++) {
    let empE = gauss(rng, -0.12, 0.1);
    if (empHist !== null) empE = 0.65 * empE + 0.35 * ((-empHist / Math.max(opts.magnitude_pct, 1)) * 10);
    let pricePass = 0.15 + rng() * 0.4;
    const hoursCut = rng() * 0.25;
    const smeMargin = 0.2 + rng() * 0.25;
    let demandHit = 0.05 + rng() * 0.2;
    if (macro === "recession") {
      empE -= 0.12;
      demandHit += 0.15;
    }
    if (macro === "high_inflation") pricePass += 0.12;
    void demandHit;
    const income = effective * (1 - hoursCut * 0.5);
    const employment = empE * effective * shock;
    const prices = (effective / 100) * pricePass * 18 * shock;
    const sme = -(effective * smeMargin * 0.35 + prices * 0.15);
    const poverty = -(income * 0.28) + Math.max(0, -employment) * 0.15;
    const gov = income * 0.08 - Math.max(0, -employment) * 0.12 + prices * 0.02;
    samples.worker_income.push(100 + income);
    samples.employment.push(100 + employment);
    samples.consumer_prices.push(100 + prices);
    samples.sme_profit.push(100 + sme);
    samples.poverty.push(100 + poverty);
    samples.government_revenue.push(100 + gov);
  }

  const metrics = Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, summarize(v)]));
  const unintended: Array<{ outcome: string; not_an_objective: boolean; magnitude: number; note: string }> = [];
  if (metrics.employment.diff_vs_100 < -0.4) {
    unintended.push({
      outcome: "Employment / hours reduction",
      not_an_objective: true,
      magnitude: Math.abs(metrics.employment.diff_vs_100),
      note: "Intended goal is worker income; job or hour losses are a side effect.",
    });
  }
  if (metrics.consumer_prices.diff_vs_100 > 0.4) {
    unintended.push({
      outcome: "Consumer price increase",
      not_an_objective: true,
      magnitude: metrics.consumer_prices.diff_vs_100,
      note: "Firms pass through part of higher labour cost.",
    });
  }
  if (metrics.sme_profit.diff_vs_100 < -1) {
    unintended.push({
      outcome: "SME profit pressure",
      not_an_objective: true,
      magnitude: Math.abs(metrics.sme_profit.diff_vs_100),
      note: "Smaller firms have thinner margins and higher wage-bill shares.",
    });
  }

  return {
    draws,
    effective_magnitude_pct: Number(effective.toFixed(2)),
    macro,
    baseline_indicators: {
      unemployment_rate: snap.unemployment_rate,
      inflation: snap.inflation,
      gini: snap.gini,
      youth_unemployment: snap.youth_unemployment,
      min_wage: snap.min_wage,
    },
    historical_priors: {
      unemployment_change_pp: empHist === null ? null : Number(empHist.toFixed(3)),
      inflation_change_pp: infHist === null ? null : Number(infHist.toFixed(3)),
      n_comparables: comps.length,
    },
    metrics,
    unintended,
  };
}

function claim(
  text: string,
  source: string,
  url: string,
  country: string,
  year: number | null | undefined,
  evidence_type: string,
  confidence: string,
  challenged = false,
) {
  return { claim: text, source, url, country, year: year ?? null, evidence_type, confidence, challenged };
}

function fmtInd(block?: Indicator, digits = 2) {
  if (!block) return "n/a";
  const val = block.value;
  if (Math.abs(val) >= 1000) return `${Math.round(val).toLocaleString()} (${block.year})`;
  return `${val.toFixed(digits)} (${block.year})`;
}

export function runDeliberation(
  policy: PolicyVector,
  coverage_pct: number,
  compliance_pct: number,
  macro: string,
) {
  policy.coverage_pct = coverage_pct;
  policy.compliance_pct = compliance_pct;
  const comps = comparableEvents(policy.country, policy.magnitude_pct);
  const sim = simulate({
    country: policy.country,
    magnitude_pct: policy.magnitude_pct,
    coverage_pct,
    compliance_pct,
    macro,
  });
  const cat = loadCatalog();
  const wb = cat.sources.world_bank;
  const snap = snapshot(policy.country).indicators;
  const emp = sim.metrics.employment.diff_vs_100;
  const inc = sim.metrics.worker_income.diff_vs_100;
  const prices = sim.metrics.consumer_prices.diff_vs_100;
  const sme = sim.metrics.sme_profit.diff_vs_100;
  const pov = sim.metrics.poverty.diff_vs_100;

  const econClaims = [
    claim(
      `${policy.country_name} unemployment is ${fmtInd(snap.unemployment_rate)} percent of the labour force; inflation is ${fmtInd(snap.inflation)} percent.`,
      "World Bank World Development Indicators",
      wb.url,
      policy.country,
      snap.unemployment_rate?.year,
      "direct",
      "high",
    ),
    claim(
      `A ${policy.magnitude_pct}% wage floor rise, after coverage and compliance, is simulated as worker income ${signed(inc)} index points, employment ${signed(emp)}, consumer prices ${signed(prices)} (median of ${sim.draws} draws). This is a model inference, not a forecast of a single number.`,
      "PolicyLens counterfactual layer (elasticities + historical priors)",
      cat.sources.min_wage.url,
      policy.country,
      policy.implementation_year,
      "model",
      "medium",
    ),
  ];
  if (comps[0]) {
    const ev = comps[0];
    const bits = [];
    if (ev.outcomes.unemployment_rate) bits.push(`unemployment ${signed(ev.outcomes.unemployment_rate.change, 2)}pp vs the year before`);
    if (ev.outcomes.inflation) bits.push(`inflation ${signed(ev.outcomes.inflation.change, 2)}pp vs the year before`);
    econClaims.push(
      claim(
        `Closest historical analogue: ${ev.country_name} ${ev.year} statutory minimum wage +${ev.magnitude_pct}%. Observed: ${bits.join("; ") || "limited outcome fields"}.`,
        "ILOSTAT min-wage series matched to World Bank outcomes",
        cat.sources.min_wage.url,
        ev.country,
        ev.year,
        "correlational",
        "medium",
      ),
    );
  }

  const socialClaims = [
    claim(
      `Who gains first: low-wage employees covered by the floor. ${policy.country_name} Gini is ${fmtInd(snap.gini)}; youth unemployment is ${fmtInd(snap.youth_unemployment)} percent. Young workers are more exposed if the floor binds and hours are cut.`,
      "World Bank WDI (SI.POV.GINI, SL.UEM.1524.ZS)",
      wb.url,
      policy.country,
      snap.gini?.year,
      "direct",
      "high",
    ),
    claim(
      `Poverty index moves ${signed(pov)} in the median scenario if income gains dominate job/hour losses. This is distributional model inference, not a poverty-line microsimulation.`,
      "PolicyLens stakeholder impact layer",
      wb.url,
      policy.country,
      policy.implementation_year,
      "model",
      snap.poverty_national ? "medium" : "low",
    ),
  ];
  const same = comps.find((c) => c.country === policy.country);
  if (same) {
    socialClaims.push(
      claim(
        `${policy.country_name} already enacted a +${same.magnitude_pct}% floor movement in ${same.year}. Same country history is more informative than a cross-border clone of the statute.`,
        "ILOSTAT detected policy event",
        cat.sources.min_wage.url,
        same.country,
        same.year,
        "direct",
        "high",
      ),
    );
  }

  const redClaims = [
    claim(
      "Do not treat LLM-style certainty as causation. Historical unemployment moves around a wage hike are correlational: recessions, COVID reopenings, and inflation shocks coincide with several events in this sample.",
      "Evaluation rule (PolicyLens evidence typology)",
      wb.url,
      policy.country,
      null,
      "llm_reasoning",
      "high",
      true,
    ),
  ];
  const inflVal = snap.inflation?.value;
  if (inflVal !== undefined && inflVal > 4) {
    redClaims.push(
      claim(
        `Current inflation snapshot is ${inflVal.toFixed(1)}%. A wage-floor jump in a high-inflation regime is a misleading analogue to a hike during stable prices.`,
        "World Bank inflation (FP.CPI.TOTL.ZG)",
        wb.url,
        policy.country,
        snap.inflation?.year,
        "direct",
        "high",
        true,
      ),
    );
  }
  const usa = comps.find((c) => c.country === "USA" && c.year <= 2010);
  if (usa) {
    redClaims.push(
      claim(
        `The ${usa.year} US federal-floor move sits next to the global financial crisis recovery. Using it as a clean experiment for ${policy.country_name} ${policy.implementation_year} is misleading.`,
        "ILOSTAT event timing vs World Bank growth",
        cat.sources.min_wage.url,
        "USA",
        usa.year,
        "correlational",
        "medium",
        true,
      ),
    );
  }
  if (policy.missing_fields.includes("youth_exemption")) {
    redClaims.push(
      claim(
        "The proposal does not specify youth, apprentice, or trainee rates. UK and Australia historically use age bands; ignoring that overstates coverage of the headline percentage.",
        "Missing-field check from policy decomposition",
        cat.sources.min_wage.url,
        policy.country,
        policy.implementation_year,
        "llm_reasoning",
        "medium",
        true,
      ),
    );
  }
  redClaims.push(
    claim(
      `SME profit is ${signed(sme)} index points in the median draw. If compliance is lower than the assumed ${compliance_pct.toFixed(0)}%, informal hours and underpayment can blunt worker gains while leaving compliant small firms at a disadvantage.`,
      "Scenario model (compliance / coverage)",
      cat.sources.min_wage.url,
      policy.country,
      policy.implementation_year,
      "model",
      "medium",
      true,
    ),
  );

  const econ = {
    id: "economic",
    name: "Economic Impact Agent",
    stance: "Labour-cost and macro channels",
    summary: `The intended income channel is real, but labour cost can feed into prices and hiring. Median simulation: income ${signed(inc)}, employment ${signed(emp)}, prices ${signed(prices)}.`,
    claims: econClaims,
  };
  const social = {
    id: "social",
    name: "Social Equity Agent",
    stance: "Who gains and who loses",
    summary:
      "Gains concentrate among covered low-wage workers; losses concentrate among hours-sensitive youth and thin-margin employers if demand is weak.",
    claims: socialClaims,
  };
  const red = {
    id: "red_team",
    name: "Adversarial / Red-Team Agent",
    stance: "Disagreement and failure discovery",
    summary:
      "Several comparisons in the set are contaminated by macro shocks; missing exemptions and compliance can change who actually receives the raise.",
    claims: redClaims,
  };

  const benefit = Math.max(0, Math.min(100, 50 + inc * 2.2));
  let confidence = sim.historical_priors.n_comparables >= 4 ? 62 : 48;
  if (policy.missing_fields.length) confidence -= 6 * Math.min(3, policy.missing_fields.length);
  const risk = Math.max(0, Math.min(100, 40 + Math.abs(Math.min(0, emp)) * 8 + Math.max(0, prices) * 6 + Math.abs(Math.min(0, sme)) * 3));
  const synthesis = {
    does_not_recommend: true,
    banner: "The system does not recommend implementation. It reports effects, risks, disagreements, and evidence.",
    expected_benefit: Math.round(benefit),
    unintended_risk: Math.round(risk),
    evidence_confidence: Math.round(Math.max(20, Math.min(88, confidence))),
    overall_risk: Math.round(risk * 0.6 + (100 - benefit) * 0.4),
    domain_scores: {
      economic: Math.round(Math.max(20, Math.min(90, 60 + emp * 4))),
      social: Math.round(Math.max(20, Math.min(90, 58 + inc * 1.8))),
      business: Math.round(Math.max(15, Math.min(85, 55 + sme * 4))),
    },
    benefits: [
      `Covered low-wage workers: simulated median income index ${signed(inc)}.`,
      `Poverty index ${signed(pov)} in the median draw if income gains stick.`,
    ],
    costs: [
      `Employment index ${signed(emp)} (median; wide tails in the Monte Carlo).`,
      `SME profit index ${signed(sme)}.`,
      `Consumer prices ${signed(prices)}.`,
    ],
    disagreements: [
      "Economic agent treats median employment drag as a usable planning number; red-team treats it as an uncertain elasticity.",
      "Social agent emphasises poverty reduction among covered workers; red-team emphasises uncovered youth and non-compliance.",
    ],
    unintended: sim.unintended,
    alternative_policies: [
      "Phase the increase over two years instead of a single step.",
      "Retain or design youth/apprentice bands and a small-firm delay.",
      "Pair with enforcement budget so compliant firms are not undercut.",
    ],
  };

  const nearest = comps[0];
  let ouBits = "thin outcome fields";
  if (nearest) {
    const bits: string[] = [];
    if (nearest.outcomes.unemployment_rate) bits.push(`unemployment ${signed(nearest.outcomes.unemployment_rate.change, 2)}pp`);
    if (nearest.outcomes.inflation) bits.push(`inflation ${signed(nearest.outcomes.inflation.change, 2)}pp`);
    if (bits.length) ouBits = bits.join("; ");
  }
  const missing = policy.missing_fields.length ? policy.missing_fields.join(", ") : "nothing material";
  const p05 = sim.metrics.employment.p05;
  const p95 = sim.metrics.employment.p95;

  type Msg = { id?: string; seq?: number; agent: string; name: string; text: string; evidence?: (typeof econClaims)[0] | null };
  const room: Msg[] = [];
  const msg = (agent: string, name: string, text: string, evidence?: Msg["evidence"]) =>
    room.push({ agent, name, text, evidence: evidence ?? null });

  msg(
    "moderator",
    "Moderator",
    `Room is open. On the table: raise the ${policy.country_name} wage floor by ${policy.magnitude_pct}% in ${policy.implementation_year}, coverage ${coverage_pct.toFixed(0)}%, compliance ${compliance_pct.toFixed(0)}%, macro = ${sim.macro}. We argue. We do not vote to implement. Economic — give the baseline.`,
  );
  msg(
    "economic",
    "Economic",
    `World Bank snapshot: unemployment ${fmtInd(snap.unemployment_rate)} percent, inflation ${fmtInd(snap.inflation)} percent. After ${sim.draws} draws I'm not offering a single forecast. Median: worker income ${signed(inc)} index points, employment ${signed(emp)}, prices ${signed(prices)}. The employment tail runs about ${p05.toFixed(1)} to ${p95.toFixed(1)}. That's a labour-cost channel, not a slogan.`,
    econClaims[0],
  );
  if (nearest) {
    msg(
      "economic",
      "Economic",
      `Closest statutory jump in the catalog is ${nearest.country_name} ${nearest.year} (+${nearest.magnitude_pct}%). Observed around that year: ${ouBits}. That's correlational — I'm using it as a prior, not as proof.`,
      econClaims[econClaims.length - 1],
    );
  }
  msg(
    "social",
    "Social",
    `Economic, you're talking about averages. The floor binds on low-wage staff, not the median earner. Gini is ${fmtInd(snap.gini)}; youth unemployment is ${fmtInd(snap.youth_unemployment)} percent. If firms cut hours, young workers take the hit while the income index still looks 'up'. Who gains and who loses is the question, not GDP to one decimal.`,
    socialClaims[0],
  );
  if (same) {
    msg(
      "social",
      "Social",
      `${policy.country_name} already moved the floor +${same.magnitude_pct}% in ${same.year}. Start with our own history before importing someone else's.`,
    );
  }
  msg(
    "red_team",
    "Red Team",
    `I'm going to stop the consensus before it forms. Several of those 'events' sit on COVID reopenings and inflation spikes — you cannot read unemployment +0.6pp as 'the wage hike did that'. Also the proposal is underspecified: missing ${missing}. If youth rates aren't in the text, you're modelling a cleaner policy than the one on the page.`,
    redClaims[0],
  );
  msg(
    "economic",
    "Economic",
    `Agreed on causation. I will not pretend the median employment move is a fact. I will also not drop the cost channel: SME profit ${signed(sme)} in the median draw. Firms with thin margins do not swallow a ${policy.magnitude_pct}% floor. Some pass it to prices (${signed(prices)}), some to hours.`,
  );
  msg(
    "social",
    "Social",
    `Then say it as incidence. Poverty index ${signed(pov)} if the raise actually lands. If compliance is only ${compliance_pct.toFixed(0)}%, uncovered workers get nothing and the cafe that pays legally looks expensive. That's a distributional failure with a green-looking income chart.`,
  );
  if (usa) {
    msg(
      "red_team",
      "Red Team",
      `And drop the ${usa.year} US federal comparison for ${policy.country_name} ${policy.implementation_year}. That hike sits next to the financial-crisis recovery. Same policy name, different economy. Same policy does not mean the same outcome. That is the point of this room.`,
    );
  } else {
    msg(
      "red_team",
      "Red Team",
      "Cross-country clones are the lazy version of evidence. Labour-market structure, coverage, and enforcement differ. If you cannot say why the analogue transfers, don't cite it as if it does.",
    );
  }
  msg(
    "moderator",
    "Moderator",
    "Three disagreements stay open: how much weight the employment median deserves versus the tails; whether coverage and youth bands are specified enough to model; which historical hikes actually transfer. Synthesis will list effects. Nobody in this room is authorised to say implement it.",
  );
  msg(
    "synthesis",
    "Synthesis",
    `Expected benefit ${synthesis.expected_benefit}/100, unintended risk ${synthesis.unintended_risk}/100, evidence confidence ${synthesis.evidence_confidence}/100. ${synthesis.benefits[0]} ${synthesis.costs[0]} Alternatives on the table: ${synthesis.alternative_policies[0]} Final decision stays human.`,
  );
  room.forEach((m, i) => {
    m.id = `m${i + 1}`;
    m.seq = i + 1;
  });

  const buckets: Array<[string, string[]]> = [
    ["Opening", ["moderator", "economic"]],
    ["Challenge", ["social", "red_team"]],
    ["Rebuttal", ["economic", "social", "red_team"]],
    ["Close", ["moderator", "synthesis"]],
  ];
  const debate = buckets.map(([title, ids], round) => ({
    round: round + 1,
    title,
    entries: room.filter((m) => ids.includes(m.agent)).map((m) => ({ agent: m.agent, name: m.name, text: m.text })),
  }));

  return {
    policy,
    comparables: comps,
    simulation: sim,
    agents: [econ, social, red],
    debate,
    transcript: room,
    synthesis,
    sources: cat.sources,
  };
}
