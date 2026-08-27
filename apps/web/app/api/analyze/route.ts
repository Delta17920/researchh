import { NextResponse } from "next/server";
import { runDeliberation, structurePolicy } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "");
  if (text.trim().length < 8) {
    return NextResponse.json({ error: "text too short" }, { status: 400 });
  }
  const policy = structurePolicy(text);
  const result = runDeliberation(
    policy,
    Number(body.coverage_pct ?? 100),
    Number(body.compliance_pct ?? 85),
    String(body.macro ?? "normal"),
  );
  return NextResponse.json(result);
}
