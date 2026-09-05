import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/engine";
import { llmConfigured, llmModel } from "@/lib/llm";

export const runtime = "nodejs";

export function GET() {
  const cat = loadCatalog();
  return NextResponse.json({
    ok: true,
    events: cat.policy_events.length,
    countries: Object.keys(cat.countries),
    live_agents: llmConfigured(),
    model: llmConfigured() ? llmModel() : null,
  });
}
