import { NextResponse } from "next/server";
import { runDeliberation, structurePolicy } from "@/lib/engine";
import { llmConfigured, llmModel, runLiveAgents, type Deliberation } from "@/lib/live-agents";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "");
  if (text.trim().length < 8) {
    return NextResponse.json({ error: "text too short" }, { status: 400 });
  }
  const policy = structurePolicy(text);
  const grounded = runDeliberation(
    policy,
    Number(body.coverage_pct ?? 100),
    Number(body.compliance_pct ?? 85),
    String(body.macro ?? "normal"),
  ) as Deliberation;
  grounded.agent_mode = "scripted";

  if (!llmConfigured() || body.scripted === true) {
    return NextResponse.json(grounded);
  }

  try {
    const live = await runLiveAgents(grounded);
    return NextResponse.json(live);
  } catch (err) {
    grounded.agent_fallback_reason =
      err instanceof Error ? err.message.slice(0, 280) : "live agents failed";
    grounded.agent_model = llmModel();
    return NextResponse.json(grounded);
  }
}
