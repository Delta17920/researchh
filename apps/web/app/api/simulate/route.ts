import { NextResponse } from "next/server";
import { simulate } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const country = String(body.country ?? "GBR");
  if (!["USA", "GBR", "CAN", "AUS"].includes(country)) {
    return NextResponse.json({ error: "country must be USA, GBR, CAN, or AUS" }, { status: 400 });
  }
  return NextResponse.json(
    simulate({
      country,
      magnitude_pct: Number(body.magnitude_pct ?? 15),
      coverage_pct: Number(body.coverage_pct ?? 100),
      compliance_pct: Number(body.compliance_pct ?? 85),
      macro: String(body.macro ?? "normal"),
    }),
  );
}
