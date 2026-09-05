import { request } from "@/lib/api/request";
import type { PerformanceDraft, PlanSnapshot, ProjectBrief, StructuredRequirement } from "@/lib/agents/types";

export type ProjectSnapshot = {
  project: ProjectBrief;
  requirement: StructuredRequirement | null;
  performanceV1: PerformanceDraft | null;
  performanceV2: PerformanceDraft | null;
  v1: PlanSnapshot | null;
  v2: PlanSnapshot | null;
  current: "v1" | "v2";
  feedback: string;
};

export async function saveProject(snapshot: ProjectSnapshot, projectId?: string, shareToken?: string) {
  const response = await request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: projectId, shareToken, snapshot }),
  });
  if (!response.ok) throw new Error("project_save_failed");
  return (await response.json()) as { ok: true; id: string; shareToken: string; shareUrl: string };
}
