import { NextRequest, NextResponse } from "next/server";
import { eventsFor } from "@/lib/engine";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  return NextResponse.json({ events: eventsFor(country, 40) });
}
