from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agents import run_deliberation
from .catalog import events_for, load_catalog
from .policy import structure_policy
from .simulation import simulate

app = FastAPI(title="PolicyLens AI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StructureIn(BaseModel):
    text: str = Field(min_length=8, max_length=4000)


class AnalyzeIn(BaseModel):
    text: str = Field(min_length=8, max_length=4000)
    coverage_pct: float = 100
    compliance_pct: float = 85
    macro: str = "normal"


class SimulateIn(BaseModel):
    country: str = "GBR"
    magnitude_pct: float = 15
    coverage_pct: float = 100
    compliance_pct: float = 85
    macro: str = "normal"


@app.get("/health")
def health():
    cat = load_catalog()
    return {
        "ok": True,
        "events": len(cat["policy_events"]),
        "countries": list(cat["countries"]),
    }


@app.get("/catalog")
def catalog():
    cat = load_catalog()
    return {
        "countries": cat["countries"],
        "sources": cat["sources"],
        "snapshot": cat["snapshot"],
        "note": cat.get("fetched_note"),
        "event_count": len(cat["policy_events"]),
    }


@app.get("/events")
def events(country: str | None = None):
    return {"events": events_for(country, limit=40)}


@app.post("/structure")
def structure(body: StructureIn):
    return structure_policy(body.text).model_dump()


@app.post("/analyze")
def analyze(body: AnalyzeIn):
    policy = structure_policy(body.text)
    return run_deliberation(policy, body.coverage_pct, body.compliance_pct, body.macro)


@app.post("/simulate")
def sim(body: SimulateIn):
    if body.country not in {"USA", "GBR", "CAN", "AUS"}:
        raise HTTPException(400, "country must be USA, GBR, CAN, or AUS")
    return simulate(
        body.country,
        body.magnitude_pct,
        coverage_pct=body.coverage_pct,
        compliance_pct=body.compliance_pct,
        macro=body.macro,
    )
