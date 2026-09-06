import type { PlanSnapshot, ProjectBrief, StructuredRequirement } from "@/lib/agents/types";

export type ProjectKnowledgeKind = "project" | "materials" | "fixed-requirements" | "protected-cues" | "creator-profile";

export type ProjectKnowledgeEntry = {
  id: string;
  kind: ProjectKnowledgeKind;
  title: string;
  summary: string;
  scope: "all" | "creative" | "execution";
};

function compact(value: string, limit = 92): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}…` : normalized;
}

export function buildProjectKnowledge(project: ProjectBrief, requirement: StructuredRequirement | null, plan: PlanSnapshot | null): ProjectKnowledgeEntry[] {
  const entries: ProjectKnowledgeEntry[] = [];
  const projectSummary = [project.projectName, project.programMaterial, project.stageConditions].filter(Boolean).join("｜");
  if (projectSummary.trim()) entries.push({ id: "project", kind: "project", title: "项目基础资料", summary: compact(projectSummary), scope: "all" });
  if (project.supportingMaterials?.trim()) entries.push({ id: "materials", kind: "materials", title: "项目资料箱", summary: compact(project.supportingMaterials), scope: "all" });
  if (requirement?.fixed.length) entries.push({ id: "fixed", kind: "fixed-requirements", title: "已确认约束", summary: compact(requirement.fixed.join("；")), scope: "all" });
  const protectedCount = plan?.rows.filter((row) => row.status === "confirmed" || row.status === "locked").length ?? 0;
  if (protectedCount) entries.push({ id: "protected-cues", kind: "protected-cues", title: "受保护 Cue", summary: `${protectedCount} 条已确认或锁定的 Cue 不会被自动覆盖。`, scope: "execution" });
  const profile = project.creatorProfile;
  const profileSummary = [profile?.aestheticPreferences, profile?.collaborationPreferences, profile?.outputDetail && `输出偏好：${profile.outputDetail}`].filter(Boolean).join("；");
  if (profileSummary.trim()) entries.push({ id: "creator-profile", kind: "creator-profile", title: "创作者偏好", summary: compact(profileSummary), scope: "creative" });
  return entries;
}
