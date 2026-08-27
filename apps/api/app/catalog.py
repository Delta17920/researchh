from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CATALOG_PATH = ROOT / "data" / "processed" / "catalog.json"


@lru_cache(maxsize=1)
def load_catalog() -> dict:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(
            f"Missing {CATALOG_PATH}. Run: python scripts/fetch_data.py"
        )
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def snapshot(country: str) -> dict:
    return load_catalog()["snapshot"].get(country, {})


def events_for(country: str | None = None, limit: int = 12) -> list[dict]:
    events = load_catalog()["policy_events"]
    if country:
        events = [e for e in events if e["country"] == country]
    return events[:limit]


def comparable_events(country: str, magnitude_pct: float, k: int = 6) -> list[dict]:
    events = load_catalog()["policy_events"]
    scored = []
    for ev in events:
        mag_gap = abs(ev["magnitude_pct"] - magnitude_pct)
        country_bonus = 0 if ev["country"] == country else 8
        recency = max(0, 2026 - ev["year"]) * 0.15
        scored.append((mag_gap + country_bonus + recency, ev))
    scored.sort(key=lambda x: x[0])
    return [ev for _, ev in scored[:k]]
