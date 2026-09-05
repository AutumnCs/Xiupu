import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { ImpactItem, PerformanceDraft, PlanSnapshot } from "@/lib/agents/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
  try {
    const body = await request.json();
    if (!body?.feedback || !body?.performance?.sections || !body?.plan?.rows || !Array.isArray(body?.impacts)) return jsonWithGuest({ ok: false, error: "missing_input" }, guest, { status: 400 });
    const result = await orchestrator.runRevision(String(body.feedback), body.performance as PerformanceDraft, body.plan as PlanSnapshot, body.impacts as ImpactItem[], guest.guestId);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (error) {
    if (error instanceof AppAIUnavailableError) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    console.error("[api/agents/revision]", error);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
