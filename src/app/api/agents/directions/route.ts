import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { StructuredRequirement } from "@/lib/agents/types";

export const maxDuration = 60;

/** POST /api/agents/directions — 创意生成 Agent */
export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });

  let requirement: StructuredRequirement | null = null;
  try {
    const body = await request.json();
    const r = body?.requirement;
    if (r && Array.isArray(r.fixed) && Array.isArray(r.creative) && Array.isArray(r.pending)) {
      requirement = r as StructuredRequirement;
    }
  } catch {
    return jsonWithGuest({ ok: false, error: "invalid_body" }, guest, { status: 400 });
  }
  if (!requirement) return jsonWithGuest({ ok: false, error: "missing_requirement" }, guest, { status: 400 });

  try {
    const result = await orchestrator.runDirections(requirement, guest.guestId);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    }
    console.error("[api/agents/directions]", err);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
