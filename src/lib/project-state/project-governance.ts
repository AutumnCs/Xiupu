import type { ProjectBrief } from "@/lib/agents/types";

export type ProjectApprovalStatus = "draft" | "confirmed" | "locked";

export function canEditProject(status: ProjectApprovalStatus): boolean {
  return status !== "locked";
}

export function toProjectSource(project: ProjectBrief): string {
  const fields: Array<[string, string]> = [
    ["项目名称", project.projectName],
    ["导演/甲方要求", project.directorRequirements],
    ["节目资料", project.programMaterial],
    ["演员信息", project.performers],
    ["舞台条件", project.stageConditions],
    ["创意意图", project.creativeIntent],
    ["补充资料", project.supportingMaterials || ""],
  ];
  return fields.filter(([, value]) => value.trim()).map(([label, value]) => `${label}：${value.trim()}`).join("\n");
}
