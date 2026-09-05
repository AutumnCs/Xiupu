import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError } from "@/lib/eazo-ai-billing";

/** POST /api/agents/requirement — 需求解析 Agent */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let brief = "";
  try {
    const body = await request.json();
    brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!brief) return NextResponse.json({ ok: false, error: "empty_brief" }, { status: 400 });

  try {
    const result = await orchestrator.runRequirement(brief, auth.user.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return NextResponse.json({ code: "app_ai_unavailable" }, { status: 402 });
    }
    console.error("[api/agents/requirement]", err);
    return NextResponse.json({ ok: false, error: "agent_failed" }, { status: 500 });
  }
}
