import { describe, expect, it } from "vitest";
import type { PlanSnapshot, ProjectBrief, StructuredRequirement } from "@/lib/agents/types";
import { buildProjectKnowledge } from "./project-intelligence";

const project: ProjectBrief = {
  projectName: "春日合唱",
  directorRequirements: "主屏需要保留品牌标识",
  programMaterial: "合唱节目，五分钟",
  performers: "30人合唱团",
  stageConditions: "三层合唱台与主LED",
  creativeIntent: "庄重但有呼吸感",
  supportingMaterials: "【节目单】四首曲目按春夏秋冬排列",
  creatorProfile: { aestheticPreferences: "克制、通透", collaborationPreferences: "先给结构再给细节", outputDetail: "balanced" },
};

const requirement: StructuredRequirement = { fixed: ["主屏保留品牌标识"], creative: ["构思视觉"], pending: [] };
const plan: PlanSnapshot = { segmentLabel: "节目", columns: [], rows: [{ id: "c1", time: "开场", music: "", speech: "", people: 30, lead: false, formationNote: "", visual: "", lighting: "", props: "", status: "locked" }] };

describe("buildProjectKnowledge", () => {
  it("collects usable project sources without exposing blank fields", () => {
    const entries = buildProjectKnowledge(project, requirement, plan);

    expect(entries.map((entry) => entry.kind)).toEqual(expect.arrayContaining(["materials", "fixed-requirements", "protected-cues", "creator-profile"]));
    expect(entries.find((entry) => entry.kind === "materials")?.summary).toContain("节目单");
    expect(entries.find((entry) => entry.kind === "protected-cues")?.summary).toContain("1");
    expect(entries.every((entry) => entry.summary.trim().length > 0)).toBe(true);
  });
});
