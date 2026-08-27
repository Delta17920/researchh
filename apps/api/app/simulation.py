from __future__ import annotations

import random
from statistics import median

from .catalog import comparable_events, snapshot


def _hist_mean(events: list[dict], metric: str) -> float | None:
    vals = []
    for ev in events:
        block = ev.get("outcomes", {}).get(metric)
        if block:
            vals.append(block["change"])
    if not vals:
        return None
    return sum(vals) / len(vals)


def simulate(
    country: str,
    magnitude_pct: float,
    coverage_pct: float = 100,
    compliance_pct: float = 85,
    macro: str = "normal",
    draws: int = 4000,
    seed: int = 7,
) -> dict:
    shock = {"normal": 1.0, "recession": 1.45, "high_inflation": 1.25}.get(macro, 1.0)
    macro_seed = {"normal": 0, "recession": 11, "high_inflation": 23}.get(macro, 0)
    rng = random.Random(seed + int(magnitude_pct * 10) + int(coverage_pct) + int(compliance_pct) + macro_seed)
    cov = coverage_pct / 100
    comp = compliance_pct / 100
    effective = magnitude_pct * cov * comp

    comps = comparable_events(country, magnitude_pct)
    emp_hist = _hist_mean(comps, "unemployment_rate")
    inf_hist = _hist_mean(comps, "inflation")
    snap = snapshot(country).get("indicators", {})

    samples = {
        "worker_income": [],
        "employment": [],
        "consumer_prices": [],
        "sme_profit": [],
        "poverty": [],
        "government_revenue": [],
    }

    for _ in range(draws):
        emp_e = rng.gauss(-0.12, 0.10)  # employment elasticity vs wage
        if emp_hist is not None:
            emp_e = 0.65 * emp_e + 0.35 * (-emp_hist / max(magnitude_pct, 1) * 10)
        price_pass = rng.uniform(0.15, 0.55)
        hours_cut = rng.uniform(0.0, 0.25)
        sme_margin = rng.uniform(0.20, 0.45)
        demand_hit = rng.uniform(0.05, 0.25)

        if macro == "recession":
            emp_e -= 0.12
            demand_hit += 0.15
        if macro == "high_inflation":
            price_pass += 0.12

        income = effective * (1 - hours_cut * 0.5)
        employment = emp_e * effective * shock
        prices = (effective / 100) * price_pass * 18 * shock  # indexed points
        sme = -(effective * sme_margin * 0.35 + prices * 0.15)
        poverty = -(income * 0.28) + max(0, -employment) * 0.15
        gov = income * 0.08 - max(0, -employment) * 0.12 + prices * 0.02

        samples["worker_income"].append(100 + income)
        samples["employment"].append(100 + employment)
        samples["consumer_prices"].append(100 + prices)
        samples["sme_profit"].append(100 + sme)
        samples["poverty"].append(100 + poverty)
        samples["government_revenue"].append(100 + gov)

    def summarize(values: list[float]) -> dict:
        ordered = sorted(values)
        n = len(ordered)
        p = lambda q: ordered[min(n - 1, int(q * (n - 1)))]
        med = median(ordered)
        return {
            "p05": round(p(0.05), 2),
            "p25": round(p(0.25), 2),
            "median": round(med, 2),
            "p75": round(p(0.75), 2),
            "p95": round(p(0.95), 2),
            "diff_vs_100": round(med - 100, 2),
        }

    metrics = {k: summarize(v) for k, v in samples.items()}
    unintended = []
    if metrics["employment"]["diff_vs_100"] < -0.4:
        unintended.append(
            {
                "outcome": "Employment / hours reduction",
                "not_an_objective": True,
                "magnitude": abs(metrics["employment"]["diff_vs_100"]),
                "note": "Intended goal is worker income; job or hour losses are a side effect.",
            }
        )
    if metrics["consumer_prices"]["diff_vs_100"] > 0.4:
        unintended.append(
            {
                "outcome": "Consumer price increase",
                "not_an_objective": True,
                "magnitude": metrics["consumer_prices"]["diff_vs_100"],
                "note": "Firms pass through part of higher labour cost.",
            }
        )
    if metrics["sme_profit"]["diff_vs_100"] < -1:
        unintended.append(
            {
                "outcome": "SME profit pressure",
                "not_an_objective": True,
                "magnitude": abs(metrics["sme_profit"]["diff_vs_100"]),
                "note": "Smaller firms have thinner margins and higher wage-bill shares.",
            }
        )

    return {
        "draws": draws,
        "effective_magnitude_pct": round(effective, 2),
        "macro": macro,
        "baseline_indicators": {
            k: snap.get(k) for k in ("unemployment_rate", "inflation", "gini", "youth_unemployment", "min_wage")
        },
        "historical_priors": {
            "unemployment_change_pp": None if emp_hist is None else round(emp_hist, 3),
            "inflation_change_pp": None if inf_hist is None else round(inf_hist, 3),
            "n_comparables": len(comps),
        },
        "metrics": metrics,
        "unintended": unintended,
    }
