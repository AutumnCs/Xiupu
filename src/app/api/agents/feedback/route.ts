import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { PlanSnapshot } from "@/lib/agents/types";

/** POST /api/agents/feedback — 反馈解析 + 影响分析 Agent */
export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });

  let feedback = "";
  let plan: PlanSnapshot | null = null;
  try {
    const body = await request.json();
    feedback = typeof body?.feedback === "string" ? body.feedback.trim() : "";
    if (body?.plan && Array.isArray(body.plan.rows)) plan = body.plan as PlanSnapshot;
  } catch {
    return jsonWithGuest({ ok: false, error: "invalid_body" }, guest, { status: 400 });
  }
  if (!feedback) return jsonWithGuest({ ok: false, error: "empty_feedback" }, guest, { status: 400 });
  if (!plan) return jsonWithGuest({ ok: false, error: "missing_plan" }, guest, { status: 400 });

  try {
    const result = await orchestrator.runFeedback(feedback, plan, guest.guestId);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    }
    console.error("[api/agents/feedback]", err);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
