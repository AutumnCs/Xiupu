import { describe, expect, it } from "vitest";
import type { PerformanceDraft, PlanSnapshot, VisualReferenceAnalysis } from "@/lib/agents/types";
import { applyVisualReferenceLinkage } from "./visual-linkage";

const performance: PerformanceDraft = {
  title: "节目",
  theme: "共生",
  overview: "从个体走向连接",
  sections: [
    { id: "s1", label: "开场", durationLabel: "约30秒", staging: "散点进入", blocking: "左右入口", visual: "微光", lighting: "冷蓝" },
    { id: "s2", label: "高潮", durationLabel: "约30秒", staging: "聚合", blocking: "中心定格", visual: "光网", lighting: "暖金" },
  ],
};

const plan: PlanSnapshot = {
  segmentLabel: "节目",
  columns: [],
  rows: [
    { id: "c1", sectionId: "s1", time: "开场", music: "", speech: "", people: 4, lead: false, formationNote: "", visual: "原视觉", lighting: "原灯光", props: "", status: "draft" },
    { id: "c2", sectionId: "s2", time: "高潮", music: "", speech: "", people: 4, lead: false, formationNote: "", visual: "已确认视觉", lighting: "", props: "", status: "confirmed" },
    { id: "c3", sectionId: "s1", time: "返场", music: "", speech: "", people: 4, lead: false, formationNote: "", visual: "锁定视觉", lighting: "", props: "", status: "locked" },
  ],
};

const analysis: VisualReferenceAnalysis = {
  summary: "轻盈的未来舞台",
  styleTags: ["通透", "未来感"],
  palette: ["雾白", "青蓝"],
  stageElements: ["半透明光幕"],
  lighting: ["柔和侧光"],
  preservedElements: ["主LED"],
  constraints: ["保留出入口"],
  prompt: "通透、轻盈、未来感的舞台视觉",
  uncertainties: [],
};

describe("applyVisualReferenceLinkage", () => {
  it("enriches creative content and skips confirmed or locked cues", () => {
    const result = applyVisualReferenceLinkage(performance, plan, analysis);

    expect(result.performance.sections[0].visual).toContain("通透、轻盈、未来感");
    expect(result.performance.sections[0].lighting).toContain("柔和侧光");
    expect(result.plan.rows[0].visual).toContain("雾白、青蓝");
    expect(result.plan.rows[0].lighting).toContain("柔和侧光");
    expect(result.plan.rows[1].visual).toBe("已确认视觉");
    expect(result.plan.rows[2].visual).toBe("锁定视觉");
    expect(result.affectedCueIds).toEqual(["c1"]);
    expect(result.skippedCueIds).toEqual(["c2", "c3"]);
    expect(plan.rows[0].visual).toBe("原视觉");
  });
});
