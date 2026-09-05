import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError } from "@/lib/eazo-ai-billing";
import type { CreativeDirection, StructuredRequirement } from "@/lib/agents/types";

/** POST /api/agents/plan — 多专业方案生成 Agent */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let direction: CreativeDirection | null = null;
  let requirement: StructuredRequirement | null = null;
  try {
    const body = await request.json();
    if (body?.direction && typeof body.direction.title === "string") {
      direction = body.direction as CreativeDirection;
    }
    if (body?.requirement && Array.isArray(body.requirement.fixed)) {
      requirement = body.requirement as StructuredRequirement;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!direction) return NextResponse.json({ ok: false, error: "missing_direction" }, { status: 400 });

  try {
    const result = await orchestrator.runPlan(direction, requirement, auth.user.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return NextResponse.json({ code: "app_ai_unavailable" }, { status: 402 });
    }
    console.error("[api/agents/plan]", err);
    return NextResponse.json({ ok: false, error: "agent_failed" }, { status: 500 });
  }
}
