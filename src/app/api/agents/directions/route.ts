import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError } from "@/lib/eazo-ai-billing";
import type { StructuredRequirement } from "@/lib/agents/types";

/** POST /api/agents/directions — 创意生成 Agent */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let requirement: StructuredRequirement | null = null;
  try {
    const body = await request.json();
    const r = body?.requirement;
    if (r && Array.isArray(r.fixed) && Array.isArray(r.creative) && Array.isArray(r.pending)) {
      requirement = r as StructuredRequirement;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!requirement) return NextResponse.json({ ok: false, error: "missing_requirement" }, { status: 400 });

  try {
    const result = await orchestrator.runDirections(requirement, auth.user.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return NextResponse.json({ code: "app_ai_unavailable" }, { status: 402 });
    }
    console.error("[api/agents/directions]", err);
    return NextResponse.json({ ok: false, error: "agent_failed" }, { status: 500 });
  }
}
