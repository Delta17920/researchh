import { NextResponse } from "next/server";
import { structurePolicy } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "");
  if (text.trim().length < 8) {
    return NextResponse.json({ error: "text too short" }, { status: 400 });
  }
  return NextResponse.json(structurePolicy(text));
}
