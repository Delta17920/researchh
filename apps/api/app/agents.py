from __future__ import annotations

from .catalog import comparable_events, load_catalog, snapshot
from .policy import PolicyVector
from .simulation import simulate
from .llm import generate_text
from .search import search_evidence


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


def is_financial(domain: str) -> bool:
    d = domain.lower()
    return "wage" in d or "tax" in d or "income" in d or "financial" in d


def economic_agent(policy: PolicyVector, sim: dict, comps: list[dict], search_data: dict) -> dict:
    inc = sim["metrics"]["worker_income"]["diff_vs_100"]
    emp = sim["metrics"]["employment"]["diff_vs_100"]
    prices = sim["metrics"]["consumer_prices"]["diff_vs_100"]
    
    if is_financial(policy.domain):
        sim_context = f"Simulation median shows: Income {inc:+.1f}, Employment {emp:+.1f}, Prices {prices:+.1f}."
    else:
        sim_context = ""
        
    prompt = f"Analyze the economic impact of a {policy.domain} policy in {policy.country}. {sim_context}\nHere is live web search data about this policy: {search_data}\n\nWrite exactly 2 short, conversational sentences focusing on the specific macroeconomic costs or benefits of {policy.domain} based on the web evidence. Do NOT use markdown."
    llm_summary = generate_text(prompt, "You are the Economic Impact Agent. Be extremely concise and analytical.") or f"Median simulation: income {inc:+.1f}, employment {emp:+.1f}, prices {prices:+.1f}."

    claims = [
        _claim(
            f"Model Inference: worker income {inc:+.1f}, employment {emp:+.1f}, consumer prices {prices:+.1f}.",
            "PolicyLens counterfactual layer", "", policy.country, policy.implementation_year, "model", "medium"
        )
    ]

    return {
        "id": "economic",
        "name": "Economic Impact Agent",
        "stance": "Labour-cost and macro channels",
        "summary": llm_summary,
        "claims": claims,
    }


def social_agent(policy: PolicyVector, sim: dict, comps: list[dict], search_data: dict) -> dict:
    pov = sim["metrics"]["poverty"]["diff_vs_100"]
    prompt = f"Analyze the social equity impact of a {policy.domain} policy in {policy.country}.\nHere is live web search data about this policy: {search_data}\n\nFocus on who gains and who loses in society from {policy.domain} based on the web evidence. Write exactly 2 short, conversational sentences. Do NOT use markdown."
    llm_summary = generate_text(prompt, "You are the Social Equity Agent. Be extremely concise and analytical.") or "Gains concentrate among covered workers; losses concentrate among hours-sensitive youth."

    claims = [
        _claim(
            f"Poverty index moves {pov:+.1f} in the median scenario.",
            "PolicyLens stakeholder layer", "", policy.country, policy.implementation_year, "model", "medium"
        )
    ]
    
    return {
        "id": "social",
        "name": "Social Equity Agent",
        "stance": "Who gains and who loses",
        "summary": llm_summary,
        "claims": claims,
    }


def red_team_agent(policy: PolicyVector, sim: dict, comps: list[dict], others: list[dict], search_data: dict) -> dict:
    prompt = f"You are the Adversarial Red-Team Agent. Provide a strong critique of a {policy.domain} policy in {policy.country}. Here is live web search data: {search_data}. Write exactly 2 incisive, conversational sentences focusing on implementation failures or ignored risks of {policy.domain} based on the evidence. Do NOT use markdown."
    llm_summary = generate_text(prompt, "You are the Adversarial Red-Team Agent. Be extremely concise, critical, and analytical.") or "Compliance rates and missing exemptions will change who actually receives the raise."

    claims = [
        _claim(
            "Live Web Evidence flags potential structural issues and unintended second-order effects.",
            "Tavily Live Search", "", policy.country, policy.implementation_year, "direct", "high", True
        )
    ]

    return {
        "id": "red_team",
        "name": "Adversarial / Red-Team Agent",
        "stance": "Disagreement and failure discovery",
        "summary": llm_summary,
        "claims": claims,
        "search_results": search_data.get("results", []) if isinstance(search_data, dict) else [],
    }


def synthesise(policy: PolicyVector, agents: list[dict], sim: dict) -> dict:
    inc = sim["metrics"]["worker_income"]["diff_vs_100"]
    emp = sim["metrics"]["employment"]["diff_vs_100"]
    sme = sim["metrics"]["sme_profit"]["diff_vs_100"]
    prices = sim["metrics"]["consumer_prices"]["diff_vs_100"]
    benefit = max(0, min(100, 50 + inc * 2.2))
    risk = max(0, min(100, 40 + abs(min(0, emp)) * 8 + max(0, prices) * 6 + abs(min(0, sme)) * 3))
    
    alts_text = generate_text(f"Suggest two short policy alternatives to {policy.domain} in {policy.country}. No markdown.", "You are a policy synthesizer.") or "Phase the implementation over two years.\nDesign specific exemptions."
    alts = [a.strip("- ") for a in alts_text.split("\n") if a.strip()]
    
    return {
        "does_not_recommend": True,
        "banner": "The system does not recommend implementation. It reports effects, risks, disagreements, and evidence.",
        "expected_benefit": round(benefit),
        "unintended_risk": round(risk),
        "evidence_confidence": 75,
        "overall_risk": round((risk * 0.6 + (100 - benefit) * 0.4)),
        "domain_scores": {
            "economic": round(max(20, min(90, 60 + emp * 4))),
            "social": round(max(20, min(90, 58 + inc * 1.8))),
            "business": round(max(15, min(85, 55 + sme * 4))),
        },
        "benefits": [
            f"Simulated median income index {inc:+.1f} (Proxy for general welfare boost).",
            f"Poverty/Inequity index {sim['metrics']['poverty']['diff_vs_100']:+.1f} in the median draw.",
        ],
        "costs": [
            f"Economic friction index {emp:+.1f}.",
            f"SME profit index {sme:+.1f}.",
            f"Consumer prices {prices:+.1f}.",
        ],
        "disagreements": [
            agents[2]["summary"]
        ],
        "unintended": sim["unintended"],
        "alternative_policies": alts,
    }


def _msg(agent: str, name: str, text: str, evidence: dict | None = None) -> dict:
    return {
        "agent": agent,
        "name": name,
        "text": text,
        "evidence": evidence,
    }


def build_transcript(policy: PolicyVector, sim: dict, econ: dict, social: dict, red: dict, synthesis: dict) -> list[dict]:
    # Round 1
    econ_arg1 = generate_text(f"State your opening position in exactly 2 short sentences. No formatting. Based on: {econ['summary']}", "You are the Economic Agent. Keep it objective and analytical.") or econ['summary']
    social_arg1 = generate_text(f"State your opening position in exactly 2 short sentences. No formatting. Based on: {social['summary']}", "You are the Social Agent. Keep it objective and analytical.") or social['summary']
    red_arg1 = generate_text(f"Provide a strong, evidence-based critique of their positions in exactly 2 short sentences. No formatting. Based on: {red['summary']}", "You are the Red Team. Keep it specific to the policy, avoiding generic language.") or red['summary']
    
    # Round 2
    econ_arg2 = generate_text(f"Briefly rebut this Red Team critique in exactly 2 short sentences: '{red_arg1}'. No formatting. Focus on economic viability.", "You are the Economic Agent. Keep it objective.") or "We must weigh those risks against the primary benefits."
    social_arg2 = generate_text(f"Briefly rebut this Red Team critique in exactly 2 short sentences: '{red_arg1}'. No formatting. Focus on social equity.", "You are the Social Agent. Keep it objective.") or "The equity concerns still demand action despite implementation risks."
    red_arg2 = generate_text(f"Give a final 2-sentence warning to close the debate. Do not yield your position. No formatting.", "You are the Red Team. Keep it specific and grounded in evidence.") or "The structural flaws remain unaddressed."

    room = [
        _msg("moderator", "Moderator", f"Debate open on {policy.domain} in {policy.country}. Economic agent, go."),
        _msg("economic", "Economic", econ_arg1, econ["claims"][0]),
        _msg("social", "Social", social_arg1, social["claims"][0]),
        _msg("red_team", "Red Team", red_arg1, red["claims"][0]),
        _msg("economic", "Economic", econ_arg2),
        _msg("social", "Social", social_arg2),
        _msg("red_team", "Red Team", red_arg2),
        _msg("moderator", "Moderator", "The risks have been flagged. Final decision is with the human."),
        _msg("synthesis", "Synthesis", f"Expected benefit {synthesis['expected_benefit']}/100, risk {synthesis['unintended_risk']}/100.")
    ]

    for i, m in enumerate(room, start=1):
        m["id"] = f"m{i}"
        m["seq"] = i
    return room


def run_deliberation(policy: PolicyVector, coverage_pct: float, compliance_pct: float, macro: str) -> dict:
    policy.coverage_pct = coverage_pct
    policy.compliance_pct = compliance_pct
    
    if not is_financial(policy.domain):
        policy.magnitude_pct = 0
        
    sim_magnitude = policy.magnitude_pct if policy.magnitude_pct > 0 else 15.0
    
    comps = comparable_events(policy.country, sim_magnitude)
    if not is_financial(policy.domain):
        comps = []
        
    sim = simulate(
        policy.country, sim_magnitude,
        coverage_pct=coverage_pct, compliance_pct=compliance_pct, macro=macro,
    )
    
    # Global search for all agents
    query = f"impacts, pros, cons, and unintended consequences of this policy: {policy.raw_text}"
    search_data = search_evidence(query, "basic")
    
    econ = economic_agent(policy, sim, comps, search_data)
    social = social_agent(policy, sim, comps, search_data)
    red = red_team_agent(policy, sim, comps, [econ, social], search_data)
    agents = [econ, social, red]
    
    synthesis = synthesise(policy, agents, sim)
    transcript = build_transcript(policy, sim, econ, social, red, synthesis)
    
    debate = []
    debate.append({"round": 1, "title": "Opening", "entries": [m for m in transcript if m["seq"] <= 3]})
    debate.append({"round": 2, "title": "Challenge", "entries": [m for m in transcript if m["seq"] == 4]})
    debate.append({"round": 3, "title": "Rebuttal", "entries": [m for m in transcript if 4 < m["seq"] <= 7]})
    debate.append({"round": 4, "title": "Close", "entries": [m for m in transcript if m["seq"] > 7]})

    return {
        "policy": policy.model_dump(),
        "comparables": comps,
        "simulation": sim,
        "agents": agents,
        "debate": debate,
        "transcript": transcript,
        "synthesis": synthesis,
        "sources": load_catalog()["sources"],
        "tavily_sources": red["search_results"],
    }
