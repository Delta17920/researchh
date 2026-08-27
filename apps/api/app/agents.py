from __future__ import annotations

from .catalog import comparable_events, load_catalog, snapshot
from .policy import PolicyVector
from .simulation import simulate


def _claim(text: str, source: str, url: str, country: str, year: int | None,
           evidence_type: str, confidence: str, challenged: bool = False) -> dict:
    return {
        "claim": text,
        "source": source,
        "url": url,
        "country": country,
        "year": year,
        "evidence_type": evidence_type,
        "confidence": confidence,
        "challenged": challenged,
    }


def _fmt_ind(block: dict | None, digits: int = 2) -> str:
    if not block:
        return "n/a"
    val = block.get("value")
    year = block.get("year")
    if val is None:
        return "n/a"
    if abs(val) >= 1000:
        return f"{val:,.0f} ({year})"
    return f"{val:.{digits}f} ({year})"


def economic_agent(policy: PolicyVector, sim: dict, comps: list[dict]) -> dict:
    cat = load_catalog()
    wb = cat["sources"]["world_bank"]
    snap = snapshot(policy.country).get("indicators", {})
    claims = []

    claims.append(
        _claim(
            f"{policy.country_name} unemployment is {_fmt_ind(snap.get('unemployment_rate'))} percent of the labour force; "
            f"inflation is {_fmt_ind(snap.get('inflation'))} percent.",
            "World Bank World Development Indicators",
            wb["url"],
            policy.country,
            (snap.get("unemployment_rate") or {}).get("year"),
            "direct",
            "high",
        )
    )

    emp = sim["metrics"]["employment"]["diff_vs_100"]
    inc = sim["metrics"]["worker_income"]["diff_vs_100"]
    prices = sim["metrics"]["consumer_prices"]["diff_vs_100"]
    claims.append(
        _claim(
            f"A {policy.magnitude_pct:g}% wage floor rise, after coverage and compliance, is simulated as "
            f"worker income {inc:+.1f} index points, employment {emp:+.1f}, consumer prices {prices:+.1f} "
            f"(median of {sim['draws']} draws). This is a model inference, not a forecast of a single number.",
            "PolicyLens counterfactual layer (elasticities + historical priors)",
            cat["sources"]["min_wage"]["url"],
            policy.country,
            policy.implementation_year,
            "model",
            "medium",
        )
    )

    if comps:
        ev = comps[0]
        ou = ev.get("outcomes", {})
        bits = []
        for metric, label in (("unemployment_rate", "unemployment"), ("inflation", "inflation")):
            if metric in ou:
                bits.append(f"{label} {ou[metric]['change']:+.2f}pp vs the year before")
        claims.append(
            _claim(
                f"Closest historical analogue: {ev['country_name']} {ev['year']} statutory minimum wage "
                f"+{ev['magnitude_pct']}%. Observed: {'; '.join(bits) or 'limited outcome fields'}.",
                "ILOSTAT min-wage series matched to World Bank outcomes",
                cat["sources"]["min_wage"]["url"],
                ev["country"],
                ev["year"],
                "correlational",
                "medium",
            )
        )

    return {
        "id": "economic",
        "name": "Economic Impact Agent",
        "stance": "Labour-cost and macro channels",
        "summary": (
            f"The intended income channel is real, but labour cost can feed into prices and hiring. "
            f"Median simulation: income {inc:+.1f}, employment {emp:+.1f}, prices {prices:+.1f}."
        ),
        "claims": claims,
    }


def social_agent(policy: PolicyVector, sim: dict, comps: list[dict]) -> dict:
    cat = load_catalog()
    snap = snapshot(policy.country).get("indicators", {})
    claims = []
    gini = snap.get("gini")
    youth = snap.get("youth_unemployment")
    claims.append(
        _claim(
            f"Who gains first: low-wage employees covered by the floor. "
            f"{policy.country_name} Gini is {_fmt_ind(gini)}; youth unemployment is {_fmt_ind(youth)} percent. "
            f"Young workers are more exposed if the floor binds and hours are cut.",
            "World Bank WDI (SI.POV.GINI, SL.UEM.1524.ZS)",
            cat["sources"]["world_bank"]["url"],
            policy.country,
            (gini or {}).get("year"),
            "direct",
            "high",
        )
    )
    pov = sim["metrics"]["poverty"]["diff_vs_100"]
    claims.append(
        _claim(
            f"Poverty index moves {pov:+.1f} in the median scenario if income gains dominate job/hour losses. "
            f"This is distributional model inference, not a poverty-line microsimulation.",
            "PolicyLens stakeholder impact layer",
            cat["sources"]["world_bank"]["url"],
            policy.country,
            policy.implementation_year,
            "model",
            "low" if snap.get("poverty_national") is None else "medium",
        )
    )
    same_country = [c for c in comps if c["country"] == policy.country]
    if same_country:
        ev = same_country[0]
        claims.append(
            _claim(
                f"{policy.country_name} already enacted a +{ev['magnitude_pct']}% floor movement in {ev['year']}. "
                f"Same country history is more informative than a cross-border clone of the statute.",
                "ILOSTAT detected policy event",
                cat["sources"]["min_wage"]["url"],
                ev["country"],
                ev["year"],
                "direct",
                "high",
            )
        )
    return {
        "id": "social",
        "name": "Social Equity Agent",
        "stance": "Who gains and who loses",
        "summary": (
            "Gains concentrate among covered low-wage workers; losses concentrate among hours-sensitive "
            "youth and thin-margin employers if demand is weak."
        ),
        "claims": claims,
    }


def red_team_agent(policy: PolicyVector, sim: dict, comps: list[dict], others: list[dict]) -> dict:
    cat = load_catalog()
    snap = snapshot(policy.country).get("indicators", {})
    claims = []
    claims.append(
        _claim(
            "Do not treat LLM-style certainty as causation. Historical unemployment moves around a wage hike "
            "are correlational: recessions, COVID reopenings, and inflation shocks coincide with several events in this sample.",
            "Evaluation rule (PolicyLens evidence typology)",
            cat["sources"]["world_bank"]["url"],
            policy.country,
            None,
            "llm_reasoning",
            "high",
            True,
        )
    )
    infl = (snap.get("inflation") or {}).get("value")
    if infl is not None and infl > 4:
        claims.append(
            _claim(
                f"Current inflation snapshot is {infl:.1f}%. A wage-floor jump in a high-inflation regime "
                f"is a misleading analogue to a hike during stable prices.",
                "World Bank inflation (FP.CPI.TOTL.ZG)",
                cat["sources"]["world_bank"]["url"],
                policy.country,
                (snap.get("inflation") or {}).get("year"),
                "direct",
                "high",
                True,
            )
        )
    usa = next((c for c in comps if c["country"] == "USA" and c["year"] <= 2010), None)
    if usa:
        claims.append(
            _claim(
                f"The {usa['year']} US federal-floor move sits next to the global financial crisis recovery. "
                f"Using it as a clean experiment for {policy.country_name} {policy.implementation_year} is misleading.",
                "ILOSTAT event timing vs World Bank growth",
                cat["sources"]["min_wage"]["url"],
                "USA",
                usa["year"],
                "correlational",
                "medium",
                True,
            )
        )
    if "youth_exemption" in policy.missing_fields:
        claims.append(
            _claim(
                "The proposal does not specify youth, apprentice, or trainee rates. UK and Australia historically "
                "use age bands; ignoring that overstates coverage of the headline percentage.",
                "Missing-field check from policy decomposition",
                cat["sources"]["min_wage"]["url"],
                policy.country,
                policy.implementation_year,
                "llm_reasoning",
                "medium",
                True,
            )
        )
    sme = sim["metrics"]["sme_profit"]["diff_vs_100"]
    claims.append(
        _claim(
            f"SME profit is {sme:+.1f} index points in the median draw. If compliance is lower than the assumed "
            f"{policy.compliance_pct:.0f}%, informal hours and underpayment can blunt worker gains while leaving "
            f"compliant small firms at a disadvantage.",
            "Scenario model (compliance / coverage)",
            cat["sources"]["min_wage"]["url"],
            policy.country,
            policy.implementation_year,
            "model",
            "medium",
            True,
        )
    )
    return {
        "id": "red_team",
        "name": "Adversarial / Red-Team Agent",
        "stance": "Disagreement and failure discovery",
        "summary": (
            "Several comparisons in the set are contaminated by macro shocks; missing exemptions and "
            "compliance can change who actually receives the raise."
        ),
        "claims": claims,
    }


def synthesise(policy: PolicyVector, agents: list[dict], sim: dict) -> dict:
    inc = sim["metrics"]["worker_income"]["diff_vs_100"]
    emp = sim["metrics"]["employment"]["diff_vs_100"]
    sme = sim["metrics"]["sme_profit"]["diff_vs_100"]
    prices = sim["metrics"]["consumer_prices"]["diff_vs_100"]
    benefit = max(0, min(100, 50 + inc * 2.2))
    risk = max(0, min(100, 40 + abs(min(0, emp)) * 8 + max(0, prices) * 6 + abs(min(0, sme)) * 3))
    confidence = 62 if sim["historical_priors"]["n_comparables"] >= 4 else 48
    if policy.missing_fields:
        confidence -= 6 * min(3, len(policy.missing_fields))
    disagreements = [
        "Economic agent treats median employment drag as a usable planning number; red-team treats it as an uncertain elasticity.",
        "Social agent emphasises poverty reduction among covered workers; red-team emphasises uncovered youth and non-compliance.",
    ]
    return {
        "does_not_recommend": True,
        "banner": "The system does not recommend implementation. It reports effects, risks, disagreements, and evidence.",
        "expected_benefit": round(benefit),
        "unintended_risk": round(risk),
        "evidence_confidence": round(max(20, min(88, confidence))),
        "overall_risk": round((risk * 0.6 + (100 - benefit) * 0.4)),
        "domain_scores": {
            "economic": round(max(20, min(90, 60 + emp * 4))),
            "social": round(max(20, min(90, 58 + inc * 1.8))),
            "business": round(max(15, min(85, 55 + sme * 4))),
        },
        "benefits": [
            f"Covered low-wage workers: simulated median income index {inc:+.1f}.",
            f"Poverty index {sim['metrics']['poverty']['diff_vs_100']:+.1f} in the median draw if income gains stick.",
        ],
        "costs": [
            f"Employment index {emp:+.1f} (median; wide tails in the Monte Carlo).",
            f"SME profit index {sme:+.1f}.",
            f"Consumer prices {prices:+.1f}.",
        ],
        "disagreements": disagreements,
        "unintended": sim["unintended"],
        "alternative_policies": [
            "Phase the increase over two years instead of a single step.",
            "Retain or design youth/apprentice bands and a small-firm delay.",
            "Pair with enforcement budget so compliant firms are not undercut.",
        ],
    }


def _msg(agent: str, name: str, text: str, evidence: dict | None = None) -> dict:
    return {
        "agent": agent,
        "name": name,
        "text": text,
        "evidence": evidence,
    }


def build_transcript(
    policy: PolicyVector,
    sim: dict,
    comps: list[dict],
    econ: dict,
    social: dict,
    red: dict,
    synthesis: dict,
) -> list[dict]:
    snap = snapshot(policy.country).get("indicators", {})
    inc = sim["metrics"]["worker_income"]["diff_vs_100"]
    emp = sim["metrics"]["employment"]["diff_vs_100"]
    prices = sim["metrics"]["consumer_prices"]["diff_vs_100"]
    sme = sim["metrics"]["sme_profit"]["diff_vs_100"]
    pov = sim["metrics"]["poverty"]["diff_vs_100"]
    p05 = sim["metrics"]["employment"]["p05"]
    p95 = sim["metrics"]["employment"]["p95"]
    nearest = comps[0] if comps else None
    same = next((c for c in comps if c["country"] == policy.country), None)
    infl = snap.get("inflation") or {}
    youth = snap.get("youth_unemployment") or {}
    gini = snap.get("gini") or {}
    missing = ", ".join(policy.missing_fields) if policy.missing_fields else "nothing material"

    ou_bits = ""
    if nearest:
        bits = []
        for metric, label in (("unemployment_rate", "unemployment"), ("inflation", "inflation")):
            if metric in nearest.get("outcomes", {}):
                bits.append(f"{label} {nearest['outcomes'][metric]['change']:+.2f}pp")
        ou_bits = "; ".join(bits) if bits else "thin outcome fields"

    room = []
    room.append(
        _msg(
            "moderator",
            "Moderator",
            f"Room is open. On the table: raise the {policy.country_name} wage floor by "
            f"{policy.magnitude_pct:g}% in {policy.implementation_year}, coverage {policy.coverage_pct:.0f}%, "
            f"compliance {policy.compliance_pct:.0f}%, macro = {sim['macro']}. "
            f"We argue. We do not vote to implement. Economic — give the baseline.",
        )
    )
    room.append(
        _msg(
            "economic",
            "Economic",
            f"World Bank snapshot: unemployment {_fmt_ind(snap.get('unemployment_rate'))} percent, "
            f"inflation {_fmt_ind(infl)} percent. After {sim['draws']} draws I'm not offering a single forecast. "
            f"Median: worker income {inc:+.1f} index points, employment {emp:+.1f}, prices {prices:+.1f}. "
            f"The employment tail runs about {p05:.1f} to {p95:.1f}. That's a labour-cost channel, not a slogan.",
            econ["claims"][0] if econ["claims"] else None,
        )
    )
    if nearest:
        room.append(
            _msg(
                "economic",
                "Economic",
                f"Closest statutory jump in the catalog is {nearest['country_name']} {nearest['year']} "
                f"(+{nearest['magnitude_pct']}%). Observed around that year: {ou_bits}. "
                f"That's correlational — I'm using it as a prior, not as proof.",
                econ["claims"][-1] if len(econ["claims"]) > 2 else None,
            )
        )
    room.append(
        _msg(
            "social",
            "Social",
            f"Economic, you're talking about averages. The floor binds on low-wage staff, not the median earner. "
            f"Gini is {_fmt_ind(gini)}; youth unemployment is {_fmt_ind(youth)} percent. "
            f"If firms cut hours, young workers take the hit while the income index still looks 'up'. "
            f"Who gains and who loses is the question, not GDP to one decimal.",
            social["claims"][0] if social["claims"] else None,
        )
    )
    if same:
        room.append(
            _msg(
                "social",
                "Social",
                f"{policy.country_name} already moved the floor +{same['magnitude_pct']}% in {same['year']}. "
                f"Start with our own history before importing someone else's.",
            )
        )
    room.append(
        _msg(
            "red_team",
            "Red Team",
            f"I'm going to stop the consensus before it forms. Several of those 'events' sit on COVID reopenings "
            f"and inflation spikes — you cannot read unemployment +0.6pp as 'the wage hike did that'. "
            f"Also the proposal is underspecified: missing {missing}. "
            f"If youth rates aren't in the text, you're modelling a cleaner policy than the one on the page.",
            red["claims"][0] if red["claims"] else None,
        )
    )
    room.append(
        _msg(
            "economic",
            "Economic",
            f"Agreed on causation. I will not pretend the median employment move is a fact. "
            f"I will also not drop the cost channel: SME profit {sme:+.1f} in the median draw. "
            f"Firms with thin margins do not swallow a {policy.magnitude_pct:g}% floor. Some pass it to prices "
            f"({prices:+.1f}), some to hours.",
        )
    )
    room.append(
        _msg(
            "social",
            "Social",
            f"Then say it as incidence. Poverty index {pov:+.1f} if the raise actually lands. "
            f"If compliance is only {policy.compliance_pct:.0f}%, uncovered workers get nothing and the cafe that "
            f"pays legally looks expensive. That's a distributional failure with a green-looking income chart.",
        )
    )
    usa = next((c for c in comps if c["country"] == "USA" and c["year"] <= 2010), None)
    if usa:
        room.append(
            _msg(
                "red_team",
                "Red Team",
                f"And drop the {usa['year']} US federal comparison for {policy.country_name} {policy.implementation_year}. "
                f"That hike sits next to the financial-crisis recovery. Same policy name, different economy. "
                f"Same policy does not mean the same outcome. That is the point of this room.",
            )
        )
    else:
        room.append(
            _msg(
                "red_team",
                "Red Team",
                "Cross-country clones are the lazy version of evidence. Labour-market structure, coverage, and "
                "enforcement differ. If you cannot say why the analogue transfers, don't cite it as if it does.",
            )
        )
    room.append(
        _msg(
            "moderator",
            "Moderator",
            "Three disagreements stay open: how much weight the employment median deserves versus the tails; "
            "whether coverage and youth bands are specified enough to model; which historical hikes actually transfer. "
            "Synthesis will list effects. Nobody in this room is authorised to say implement it.",
        )
    )
    room.append(
        _msg(
            "synthesis",
            "Synthesis",
            f"Expected benefit {synthesis['expected_benefit']}/100, unintended risk {synthesis['unintended_risk']}/100, "
            f"evidence confidence {synthesis['evidence_confidence']}/100. "
            f"{synthesis['benefits'][0]} {synthesis['costs'][0]} "
            f"Alternatives on the table: {synthesis['alternative_policies'][0]} "
            f"Final decision stays human.",
        )
    )
    for i, m in enumerate(room, start=1):
        m["id"] = f"m{i}"
        m["seq"] = i
    return room


def run_deliberation(policy: PolicyVector, coverage_pct: float, compliance_pct: float, macro: str) -> dict:
    policy.coverage_pct = coverage_pct
    policy.compliance_pct = compliance_pct
    comps = comparable_events(policy.country, policy.magnitude_pct)
    sim = simulate(
        policy.country,
        policy.magnitude_pct,
        coverage_pct=coverage_pct,
        compliance_pct=compliance_pct,
        macro=macro,
    )
    econ = economic_agent(policy, sim, comps)
    social = social_agent(policy, sim, comps)
    red = red_team_agent(policy, sim, comps, [econ, social])
    agents = [econ, social, red]
    synthesis = synthesise(policy, agents, sim)
    transcript = build_transcript(policy, sim, comps, econ, social, red, synthesis)
    debate = []
    buckets = [
        ("Opening", ["moderator", "economic"]),
        ("Challenge", ["social", "red_team"]),
        ("Rebuttal", ["economic", "social", "red_team"]),
        ("Close", ["moderator", "synthesis"]),
    ]
    for round_id, (title, ids) in enumerate(buckets, start=1):
        entries = [
            {"agent": m["agent"], "name": m["name"], "text": m["text"]}
            for m in transcript
            if m["agent"] in ids
        ]
        debate.append({"round": round_id, "title": title, "entries": entries})

    return {
        "policy": policy.model_dump(),
        "comparables": comps,
        "simulation": sim,
        "agents": agents,
        "debate": debate,
        "transcript": transcript,
        "synthesis": synthesis,
        "sources": load_catalog()["sources"],
    }
