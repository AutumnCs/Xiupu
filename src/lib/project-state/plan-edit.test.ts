import { describe, expect, it } from "vitest";
import { updatePlanRow } from "./plan-edit";
import type { PlanSnapshot } from "@/lib/agents/types";

const plan: PlanSnapshot = {
  segmentLabel: "测试段落",
  columns: [],
  rows: [{ time: "0:00–0:10", music: "原音乐", speech: "（无）", people: 2, lead: false, formationNote: "两人并列", visual: "原视觉", lighting: "原灯光", props: "无", camera: "", notes: "" }],
};

describe("updatePlanRow", () => {
  it("returns a new plan and changes only the requested Cue field", () => {
    const next = updatePlanRow(plan, 0, "time", "0:00–0:12");

    expect(next).not.toBe(plan);
    expect(next.rows[0].time).toBe("0:00–0:12");
    expect(next.rows[0].music).toBe("原音乐");
    expect(plan.rows[0].time).toBe("0:00–0:10");
  });
});
