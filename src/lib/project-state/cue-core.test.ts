import { describe, expect, it } from "vitest";
import { getCueContext, updateCueStatus } from "./cue-core";
import type { PlanSnapshot } from "@/lib/agents/types";

const plan: PlanSnapshot = {
  segmentLabel: "节目",
  columns: [],
  rows: [
    { id: "c1", time: "0:00–0:10", music: "前奏", speech: "", people: 4, lead: false, formationNote: "入场", visual: "", lighting: "", props: "" },
    { id: "c2", time: "0:10–0:20", music: "主段", speech: "", people: 4, lead: true, formationNote: "中心", visual: "", lighting: "", props: "" },
  ],
};

describe("cue core", () => {
  it("provides the neighboring Cue context for a selected Cue", () => {
    expect(getCueContext(plan, 1)).toEqual({ previous: "Cue 1 · 0:00–0:10", next: null });
  });

  it("changes only the selected Cue approval state", () => {
    const next = updateCueStatus(plan, 1, "confirmed");
    expect(next.rows.map((row) => row.status)).toEqual([undefined, "confirmed"]);
    expect(plan.rows[1].status).toBeUndefined();
  });
});
