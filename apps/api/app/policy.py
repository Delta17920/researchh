from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field

CountryCode = Literal["USA", "GBR", "CAN", "AUS"]

COUNTRY_ALIASES = {
    "usa": "USA",
    "us": "USA",
    "united states": "USA",
    "america": "USA",
    "uk": "GBR",
    "u.k.": "GBR",
    "united kingdom": "GBR",
    "britain": "GBR",
    "great britain": "GBR",
    "england": "GBR",
    "canada": "CAN",
    "australian": "AUS",
    "australia": "AUS",
}


class PolicyVector(BaseModel):
    raw_text: str
    country: CountryCode = "GBR"
    country_name: str = "United Kingdom"
    domain: str = "minimum_wage"
    magnitude_pct: float = Field(ge=0, le=200)
    implementation_year: int = 2027
    duration: str = "permanent"
    target_groups: list[str] = ["low-wage workers"]
    primary_objective: str = "Increase worker income"
    exemptions: list[str] = []
    coverage_pct: float = 100
    compliance_pct: float = 85
    assumptions: list[str] = []
    missing_fields: list[str] = []


COUNTRY_NAMES = {
    "USA": "United States",
    "GBR": "United Kingdom",
    "CAN": "Canada",
    "AUS": "Australia",
}


def structure_policy(text: str) -> PolicyVector:
    lowered = text.lower()
    missing: list[str] = []
    assumptions: list[str] = []

    country: CountryCode | None = None
    for alias, code in sorted(COUNTRY_ALIASES.items(), key=lambda x: -len(x[0])):
        if re.search(rf"\b{re.escape(alias)}\b", lowered):
            country = code  # type: ignore[assignment]
            break
    if country is None:
        country = "GBR"
        missing.append("country")
        assumptions.append("Country defaulted to United Kingdom.")

    mag = None
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", lowered)
    if m:
        mag = float(m.group(1))
    else:
        m = re.search(r"by\s+(\d+(?:\.\d+)?)\s*(percent|per cent)", lowered)
        if m:
            mag = float(m.group(1))
    if mag is None:
        mag = 15.0
        missing.append("magnitude")
        assumptions.append("Magnitude defaulted to +15%.")

    year = None
    y = re.search(r"\b(20[2-3][0-9])\b", text)
    if y:
        year = int(y.group(1))
    else:
        year = 2027
        missing.append("implementation_year")
        assumptions.append("Implementation year defaulted to 2027.")

    if not re.search(r"minimum wage|min wage|living wage|wage floor|hourly wage", lowered):
        assumptions.append("Interpreted as a minimum-wage policy (MVP domain).")

    exemptions = []
    if re.search(r"youth|under[- ]18|young worker", lowered):
        exemptions.append("youth rates mentioned")
    else:
        missing.append("youth_exemption")
        assumptions.append("Youth/apprentice exemptions were not specified.")

    if re.search(r"small (firm|business)|sme", lowered):
        exemptions.append("small-business mention")
    else:
        missing.append("small_business_exemption")

    return PolicyVector(
        raw_text=text.strip(),
        country=country,
        country_name=COUNTRY_NAMES[country],
        magnitude_pct=mag,
        implementation_year=year,
        exemptions=exemptions,
        assumptions=assumptions,
        missing_fields=missing,
    )
