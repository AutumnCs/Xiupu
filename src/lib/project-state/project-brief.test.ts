import { describe, expect, it } from "vitest";
import { buildProjectBrief } from "./project-brief";

describe("buildProjectBrief", () => {
  it("keeps one natural-language brief available to every downstream stage", () => {
    const project = buildProjectBrief("中央歌剧院合唱团，5分钟，三层合唱台，结尾要庄严。", "附件：节目单");
    expect(project.projectName).toBe("未命名节目");
    expect(project.programMaterial).toContain("中央歌剧院合唱团");
    expect(project.directorRequirements).toContain("中央歌剧院合唱团");
    expect(project.supportingMaterials).toBe("附件：节目单");
  });
});
