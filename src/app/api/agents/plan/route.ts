import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { CreativeDirection, StructuredRequirement } from "@/lib/agents/types";

/** POST /api/agents/plan — 多专业方案生成 Agent */
export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });

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
    return jsonWithGuest({ ok: false, error: "invalid_body" }, guest, { status: 400 });
  }
  if (!direction) return jsonWithGuest({ ok: false, error: "missing_direction" }, guest, { status: 400 });

  try {
    const result = await orchestrator.runPlan(direction, requirement, guest.guestId);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (err) {
    if (err instanceof AppAIUnavailableError) {
      return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    }
    console.error("[api/agents/plan]", err);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
