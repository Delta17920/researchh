import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/engine";

export const runtime = "nodejs";

export function GET() {
  const cat = loadCatalog();
  return NextResponse.json({
    ok: true,
    events: cat.policy_events.length,
    countries: Object.keys(cat.countries),
  });
}
