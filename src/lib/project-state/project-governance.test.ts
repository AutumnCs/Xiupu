import { describe, expect, it } from "vitest";
import { canEditProject, toProjectSource, type ProjectApprovalStatus } from "./project-governance";

describe("project governance", () => {
  it("turns categorized project information into one source of truth for AI", () => {
    expect(toProjectSource({
      projectName: "春生",
      directorRequirements: "庄重，不使用烟火",
      programMaterial: "合唱节目，5分钟",
      performers: "32人合唱团",
      stageConditions: "三层台阶，主LED",
      creativeIntent: "由克制到庄严",
    })).toContain("舞台条件：三层台阶，主LED");
  });

  it("prevents edits only when the project is locked", () => {
    const statuses: ProjectApprovalStatus[] = ["draft", "confirmed", "locked"];
    expect(statuses.map(canEditProject)).toEqual([true, true, false]);
  });
});
