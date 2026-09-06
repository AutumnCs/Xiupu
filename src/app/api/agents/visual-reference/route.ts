import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AppAIUnavailableError, isProviderConfigured } from "@/lib/ai/provider";
import type { CreativeDirection, ProjectBrief } from "@/lib/agents/types";

export const maxDuration = 60;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

/** POST /api/agents/visual-reference — 参考图 + 约束 → 可编辑视觉方向 */
export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  if (!isProviderConfigured()) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
  const body = await request.formData();
  const file = body.get("image");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return jsonWithGuest({ ok: false, error: "missing_image" }, guest, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) return jsonWithGuest({ ok: false, error: "image_too_large" }, guest, { status: 413 });
  let project: ProjectBrief;
  let direction: CreativeDirection | undefined;
  try {
    project = JSON.parse(String(body.get("project") || "{}")) as ProjectBrief;
    const rawDirection = String(body.get("direction") || "");
    direction = rawDirection ? JSON.parse(rawDirection) as CreativeDirection : undefined;
  } catch {
    return jsonWithGuest({ ok: false, error: "invalid_context" }, guest, { status: 400 });
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const imageDataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
    const result = await orchestrator.runVisualReference({ imageDataUrl, project, direction, logoNotes: String(body.get("logoNotes") || ""), mustKeep: String(body.get("mustKeep") || "") }, guest.guestId);
    return jsonWithGuest({ ok: true, result }, guest);
  } catch (error) {
    if (error instanceof AppAIUnavailableError) return jsonWithGuest({ code: "app_ai_unavailable" }, guest, { status: 503 });
    console.error("[api/agents/visual-reference]", error);
    return jsonWithGuest({ ok: false, error: "agent_failed" }, guest, { status: 500 });
  }
}
