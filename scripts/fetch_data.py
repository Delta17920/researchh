"""Download public World Bank, OECD, and ILO datasets. No API keys required."""

from __future__ import annotations

import csv
import io
import json
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
RAW.mkdir(parents=True, exist_ok=True)
PROCESSED.mkdir(parents=True, exist_ok=True)

COUNTRIES = ["USA", "GBR", "CAN", "AUS"]
COUNTRY_NAMES = {
    "USA": "United States",
    "GBR": "United Kingdom",
    "CAN": "Canada",
    "AUS": "Australia",
}

WDI_INDICATORS = {
    "SL.UEM.TOTL.ZS": "unemployment_rate",
    "SL.UEM.1524.ZS": "youth_unemployment",
    "FP.CPI.TOTL.ZG": "inflation",
    "NY.GDP.PCAP.KD": "gdp_per_capita",
    "NY.GDP.MKTP.KD.ZG": "gdp_growth",
    "SI.POV.GINI": "gini",
    "SP.POP.TOTL": "population",
    "SL.EMP.WORK.ZS": "wage_workers_pct",
    "SL.TLF.CACT.ZS": "labor_force_participation",
    "SI.POV.NAHC": "poverty_national",
}

UA = "PolicyLensAI/0.1 (research prototype; educational use)"
CTX = ssl.create_default_context()


def get(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
        return resp.read()


def get_json(url: str):
    return json.loads(get(url).decode("utf-8"))


def fetch_world_bank() -> dict:
    series: dict[str, dict[str, dict[str, float]]] = {c: {} for c in COUNTRIES}
    meta = {}
    for code, name in WDI_INDICATORS.items():
        url = (
            "https://api.worldbank.org/v2/country/"
            + ";".join(COUNTRIES)
            + f"/indicator/{code}?format=json&per_page=20000&date=1990:2025"
        )
        print(f"World Bank {code} ({name})...")
        payload = get_json(url)
        if not isinstance(payload, list) or len(payload) < 2:
            print(f"  unexpected payload for {code}")
            continue
        rows = payload[1] or []
        n = 0
        for row in rows:
            iso = (row.get("countryiso3code") or "").upper()
            year = str(row.get("date") or "")
            val = row.get("value")
            if iso not in series or not year or val is None:
                continue
            series[iso].setdefault(year, {})[name] = float(val)
            n += 1
        meta[name] = {
            "source": "World Bank World Development Indicators",
            "indicator": code,
            "url": f"https://data.worldbank.org/indicator/{code}",
            "observations": n,
        }
        time.sleep(0.4)
    RAW.joinpath("world_bank_wdi.json").write_text(json.dumps(series, indent=2), encoding="utf-8")
    return {"series": series, "meta": meta}


ILO_MIN_WAGE_URLS = {
    "ppp": "https://sdmx.ilo.org/rest/data/ILO,DF_EAR_INEE_CUR_NB,1.0/USA+GBR+CAN+AUS.A.EAR_INEE_NB.CUR_TYPE_PPP?startPeriod=1990&format=csv",
    "lcu": "https://sdmx.ilo.org/rest/data/ILO,DF_EAR_INEE_CUR_NB,1.0/USA+GBR+CAN+AUS.A.EAR_INEE_NB.CUR_TYPE_LCU?startPeriod=1990&format=csv",
}

FRED_US_HOURLY = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=FEDMINNFRWG"


def parse_oecd_csv(text: str) -> list[dict]:
    sample = text[:4000]
    dialect = csv.Sniffer().sniff(sample, delimiters=",;")
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    rows = []
    for row in reader:
        rows.append({(k or "").strip(): (v or "").strip() for k, v in row.items()})
    return rows


def country_from_row(row: dict) -> str | None:
    blob = " ".join(row.values()).upper()
    mapping = {
        "USA": ["USA", "UNITED STATES"],
        "GBR": ["GBR", "UNITED KINGDOM", "GREAT BRITAIN"],
        "CAN": ["CAN", "CANADA"],
        "AUS": ["AUS", "AUSTRALIA"],
    }
    for code, aliases in mapping.items():
        for a in aliases:
            if a in blob:
                return code
    return None


def year_from_row(row: dict) -> str | None:
    for key in ("TIME_PERIOD", "Time period", "TIME", "Year", "YEAR"):
        if key in row and row[key][:4].isdigit():
            return row[key][:4]
    for v in row.values():
        if len(v) >= 4 and v[:4].isdigit() and 1990 <= int(v[:4]) <= 2026:
            return v[:4]
    return None


def value_from_row(row: dict) -> float | None:
    for key in ("OBS_VALUE", "Observation value", "Value", "VALUE"):
        if key in row and row[key]:
            try:
                return float(row[key].replace(",", ""))
            except ValueError:
                continue
    for v in row.values():
        try:
            f = float(v.replace(",", ""))
            if abs(f) > 0:
                return f
        except ValueError:
            continue
    return None


def parse_ilo_series(text: str) -> dict[str, dict[str, float]]:
    rows = parse_oecd_csv(text)
    series: dict[str, dict[str, float]] = {c: {} for c in COUNTRIES}
    for row in rows:
        iso = (row.get("REF_AREA") or "").upper()
        if iso not in series:
            iso = country_from_row(row) or ""
        year = row.get("TIME_PERIOD") or year_from_row(row)
        try:
            val = float((row.get("OBS_VALUE") or "").replace(",", ""))
        except ValueError:
            val = value_from_row(row)
        if iso not in series or not year or val is None:
            continue
        series[iso][str(year)[:4]] = val
    return series


def fetch_ilo_min_wage() -> dict:
    packs = {}
    for label, url in ILO_MIN_WAGE_URLS.items():
        print(f"ILO {label}: {url[:110]}...")
        text = get(url, timeout=120).decode("utf-8", errors="replace")
        RAW.joinpath(f"ilo_min_wage_{label}.csv").write_text(text, encoding="utf-8")
        series = parse_ilo_series(text)
        n = sum(len(v) for v in series.values())
        print(f"  {n} observations")
        packs[label] = series
    if sum(len(v) for v in packs["lcu"].values()) < 20:
        raise RuntimeError("ILO min wage series too small")
    return {
        "series": packs["lcu"],
        "series_ppp": packs["ppp"],
        "source": "ILOSTAT monthly minimum wage (EAR_INEE, local currency and PPP)",
        "url": ILO_MIN_WAGE_URLS["lcu"],
        "observations": sum(len(v) for v in packs["lcu"].values()),
    }


def fetch_fred_us_hourly() -> dict[str, float]:
    print("FRED US federal hourly minimum wage...")
    text = get(FRED_US_HOURLY, timeout=60).decode("utf-8", errors="replace")
    RAW.joinpath("fred_us_fed_min_wage.csv").write_text(text, encoding="utf-8")
    yearly: dict[str, float] = {}
    for row in parse_oecd_csv(text):
        date = row.get("observation_date") or row.get("DATE") or ""
        val = row.get("FEDMINNFRWG") or row.get("value")
        if len(date) >= 4 and val:
            try:
                yearly[date[:4]] = float(val)
            except ValueError:
                continue
    print(f"  {len(yearly)} years")
    return yearly


def detect_events(min_wage: dict[str, dict[str, float]]) -> list[dict]:
    events = []
    for iso, years in min_wage.items():
        ordered = sorted((int(y), v) for y, v in years.items() if v and v > 0)
        for i in range(1, len(ordered)):
            y0, v0 = ordered[i - 1]
            y1, v1 = ordered[i]
            if y1 != y0 + 1 or v0 <= 0:
                continue
            pct = (v1 - v0) / v0 * 100
            if pct >= 8:
                events.append(
                    {
                        "id": f"{iso}-{y1}-mw",
                        "country": iso,
                        "country_name": COUNTRY_NAMES[iso],
                        "year": y1,
                        "policy": "Minimum wage increase",
                        "magnitude_pct": round(pct, 2),
                        "from_value": v0,
                        "to_value": v1,
                        "source": "Detected from official minimum-wage time series",
                    }
                )
    events.sort(key=lambda e: (e["year"], e["country"]), reverse=True)
    return events


def attach_outcomes(events: list[dict], wdi: dict) -> list[dict]:
    series = wdi["series"]
    out = []
    for ev in events:
        iso = ev["country"]
        y = ev["year"]
        country = series.get(iso, {})
        before = country.get(str(y - 1), {})
        after = country.get(str(min(y + 1, 2024)), {})
        outcomes = {}
        for metric in ("unemployment_rate", "inflation", "gdp_growth", "gini"):
            b, a = before.get(metric), after.get(metric)
            if b is not None and a is not None:
                outcomes[metric] = {
                    "before": round(b, 3),
                    "after": round(a, 3),
                    "change": round(a - b, 3),
                }
        item = dict(ev)
        item["outcomes"] = outcomes
        out.append(item)
    return out


def latest_snapshot(wdi: dict, min_wage: dict) -> dict:
    snap = {}
    for iso in COUNTRIES:
        years = sorted(wdi["series"].get(iso, {}).keys())
        latest = {}
        for y in reversed(years):
            for k, v in wdi["series"][iso][y].items():
                latest.setdefault(k, {"value": v, "year": int(y)})
        mw_years = sorted(min_wage.get(iso, {}).keys())
        if mw_years:
            y = mw_years[-1]
            latest["min_wage"] = {"value": min_wage[iso][y], "year": int(y)}
        snap[iso] = {"name": COUNTRY_NAMES[iso], "indicators": latest}
    return snap


def main() -> None:
    wdi = fetch_world_bank()
    min_wage_pack = fetch_ilo_min_wage()
    fred_us = fetch_fred_us_hourly()

    events = attach_outcomes(detect_events(min_wage_pack["series"]), wdi)
    snapshot = latest_snapshot(wdi, min_wage_pack["series"])

    processed = {
        "countries": COUNTRY_NAMES,
        "sources": {
            "world_bank": {
                "name": "World Bank World Development Indicators",
                "url": "https://data.worldbank.org",
                "indicators": wdi["meta"],
            },
            "min_wage": {
                "name": min_wage_pack["source"],
                "url": min_wage_pack["url"],
                "observations": min_wage_pack["observations"],
            },
            "fred_us": {
                "name": "FRED federal minimum wage (FEDMINNFRWG)",
                "url": FRED_US_HOURLY,
                "observations": len(fred_us),
            },
        },
        "indicators": wdi["series"],
        "min_wage": min_wage_pack["series"],
        "min_wage_ppp": min_wage_pack.get("series_ppp", {}),
        "us_federal_hourly": fred_us,
        "policy_events": events,
        "snapshot": snapshot,
        "fetched_note": "Public APIs, no keys. Policy events are year-on-year minimum-wage increases of 8% or more.",
    }
    path = PROCESSED / "catalog.json"
    path.write_text(json.dumps(processed, indent=2), encoding="utf-8")
    print(f"Wrote {path} with {len(events)} policy events")


if __name__ == "__main__":
    main()
