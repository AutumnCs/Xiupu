import { request } from "@/lib/api/request";
import type { AgentRunTrace, PerformanceDraft, PlanSnapshot, ProjectBrief, StructuredRequirement } from "@/lib/agents/types";
import type { ProjectApprovalStatus } from "@/lib/project-state/project-governance";

export type ProjectSnapshot = {
  project: ProjectBrief;
  requirement: StructuredRequirement | null;
  performanceV1: PerformanceDraft | null;
  performanceV2: PerformanceDraft | null;
  v1: PlanSnapshot | null;
  v2: PlanSnapshot | null;
  current: "v1" | "v2";
  feedback: string;
  approvalStatus?: ProjectApprovalStatus;
  revisionRecords?: RevisionRecord[];
  agentRuns?: AgentRunTrace[];
};

export type RevisionRecord = { id: string; source: string; reason: string; cueIds: string[]; departments: string[]; status: "pending" | "confirmed" | "locked"; createdAt: string };

export type ProjectListItem = { id: string; title: string; share_token: string; updated_at: string };
export type VersionListItem = { id: string; version: number; summary: string; created_at: string };

export async function saveProject(snapshot: ProjectSnapshot, projectId?: string, shareToken?: string) {
  const response = await request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: projectId, shareToken, snapshot }),
  });
  if (!response.ok) throw new Error("project_save_failed");
  return (await response.json()) as { ok: true; id: string; version: number; shareToken: string; shareUrl: string };
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const response = await request("/api/projects");
  if (!response.ok) throw new Error("project_list_failed");
  const data = await response.json() as { projects?: ProjectListItem[] };
  return data.projects ?? [];
}

export async function listProjectVersions(projectId: string): Promise<VersionListItem[]> {
  const response = await request(`/api/projects?projectId=${encodeURIComponent(projectId)}`);
  if (!response.ok) throw new Error("version_list_failed");
  const data = await response.json() as { versions?: VersionListItem[] };
  return data.versions ?? [];
}

export async function loadProjectVersion(projectId: string, version: number): Promise<{ id: string; snapshot: ProjectSnapshot; version: number; summary: string; created_at: string }> {
  const response = await request(`/api/projects?projectId=${encodeURIComponent(projectId)}&version=${version}`);
  if (!response.ok) throw new Error("version_load_failed");
  const data = await response.json() as { project: { id: string; snapshot: ProjectSnapshot; version: number; summary: string; created_at: string } };
  return data.project;
}

export async function loadProjectShare(shareToken: string): Promise<{ id: string; snapshot: ProjectSnapshot; updated_at: string }> {
  const response = await request(`/api/projects?share=${encodeURIComponent(shareToken)}`);
  if (!response.ok) throw new Error("project_load_failed");
  const data = await response.json() as { project: { id: string; snapshot: ProjectSnapshot; updated_at: string } };
  return data.project;
}
