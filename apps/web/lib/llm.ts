export type ChatTurn = {
  text: string;
  evidence_type: "direct" | "correlational" | "model" | "llm_reasoning";
  source: string;
  confidence: "very_high" | "high" | "medium" | "low" | "very_low";
};

function apiKey() {
  return process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
}

export function llmConfigured() {
  return Boolean(apiKey());
}

export function llmModel() {
  return process.env.GROQ_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "llama-3.3-70b-versatile";
}

function endpoint() {
  const base = (
    process.env.GROQ_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.groq.com/openai/v1"
  ).replace(/\/$/, "");
  return `${base}/chat/completions`;
}

export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  return null;
}

export async function completeJson(system: string, user: string): Promise<ChatTurn> {
  const key = apiKey();
  if (!key) throw new Error("GROQ_API_KEY missing");

  const payload = {
    model: llmModel(),
    temperature: 0.45,
    max_tokens: 420,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  const ctrl = AbortSignal.timeout(22_000);
  async function once(withJsonMode: boolean) {
    const res = await fetch(endpoint(), {
      method: "POST",
      signal: ctrl,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withJsonMode ? { ...payload, response_format: { type: "json_object" } } : payload,
      ),
    });
    return res;
  }

  let res = await once(true);
  if (res.status === 400) res = await once(false);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${err.slice(0, 240)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonObject(content);
  const text = String(parsed?.text ?? "").trim();
  if (text.length < 40) throw new Error("LLM returned an empty or short turn");
  const evidence =
    parsed?.evidence_type === "direct" ||
    parsed?.evidence_type === "correlational" ||
    parsed?.evidence_type === "model" ||
    parsed?.evidence_type === "llm_reasoning"
      ? parsed.evidence_type
      : "llm_reasoning";
  const confidence =
    parsed?.confidence === "very_high" ||
    parsed?.confidence === "high" ||
    parsed?.confidence === "medium" ||
    parsed?.confidence === "low" ||
    parsed?.confidence === "very_low"
      ? parsed.confidence
      : "medium";
  return {
    text,
    evidence_type: evidence,
    source: String(parsed?.source ?? "PolicyLens context pack"),
    confidence,
  };
}
