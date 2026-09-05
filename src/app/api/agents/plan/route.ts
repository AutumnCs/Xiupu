import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { PerformanceDraft, ProjectBrief } from "@/lib/agents/types";

export const maxDuration = 60;

/** POST /api/agents/plan — 多专业方案生成 Agent */
export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });

  let performance: PerformanceDraft | null = null;
  let project: ProjectBrief | null = null;
  try {
    const body = await request.json();
    if (body?.performance?.sections && Array.isArray(body.performance.sections)) performance = body.performance as PerformanceDraft;
    if (body?.project?.projectName) project = body.project as ProjectBrief;
  } catch {
    return jsonWithGuest({ ok: false, error: "invalid_body" }, guest, { status: 400 });
  }
  if (!performance || !project) return jsonWithGuest({ ok: false, error: "missing_input" }, guest, { status: 400 });

  try {
    const result = await orchestrator.runPlan(performance, project, guest.guestId);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    }
    console.error("[api/agents/plan]", err);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
