import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError } from "@/lib/eazo-ai-billing";
import type { PlanSnapshot } from "@/lib/agents/types";

/** POST /api/agents/validate — 一致性检查 Agent */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let plan: PlanSnapshot | null = null;
  try {
    const body = await request.json();
    if (body?.plan && Array.isArray(body.plan.rows)) plan = body.plan as PlanSnapshot;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!plan) return NextResponse.json({ ok: false, error: "missing_plan" }, { status: 400 });

  try {
    const result = await orchestrator.runValidate(plan, auth.user.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return NextResponse.json({ code: "app_ai_unavailable" }, { status: 402 });
    }
    console.error("[api/agents/validate]", err);
    return NextResponse.json({ ok: false, error: "agent_failed" }, { status: 500 });
  }
}
