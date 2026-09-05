import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { PerformanceDraft, PlanSnapshot } from "@/lib/agents/types";

export const maxDuration = 60;

/** POST /api/agents/feedback — 反馈解析 + 影响分析 Agent */
export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });

  let feedback = "";
  let plan: PlanSnapshot | null = null;
  let performance: PerformanceDraft | null = null;
  let confirmedTitles: string[] = [];
  try {
    const body = await request.json();
    feedback = typeof body?.feedback === "string" ? body.feedback.trim() : "";
    if (body?.plan && Array.isArray(body.plan.rows)) plan = body.plan as PlanSnapshot;
    if (body?.performance && Array.isArray(body.performance.sections)) performance = body.performance as PerformanceDraft;
    if (Array.isArray(body?.confirmedTitles)) confirmedTitles = body.confirmedTitles.map(String).slice(0, 12);
  } catch {
    return jsonWithGuest({ ok: false, error: "invalid_body" }, guest, { status: 400 });
  }
  if (!feedback) return jsonWithGuest({ ok: false, error: "empty_feedback" }, guest, { status: 400 });
  if (!plan || !performance) return jsonWithGuest({ ok: false, error: "missing_plan" }, guest, { status: 400 });

  try {
    const result = await orchestrator.runFeedback(feedback, performance, plan, guest.guestId, confirmedTitles);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    }
    console.error("[api/agents/feedback]", err);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
