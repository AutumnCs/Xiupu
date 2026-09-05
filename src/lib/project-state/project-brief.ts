import type { ProjectBrief } from "@/lib/agents/types";

export function buildProjectBrief(rawBrief: string, supportingMaterials = ""): ProjectBrief {
  const brief = rawBrief.trim();
  return {
    projectName: "未命名节目",
    directorRequirements: brief,
    programMaterial: brief,
    performers: "",
    stageConditions: "",
    creativeIntent: "",
    supportingMaterials: supportingMaterials.trim(),
  };
}
