import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/engine";

export const runtime = "nodejs";

export function GET() {
  const cat = loadCatalog();
  return NextResponse.json({
    countries: cat.countries,
    sources: cat.sources,
    snapshot: cat.snapshot,
    note: cat.fetched_note,
    event_count: cat.policy_events.length,
  });
}
