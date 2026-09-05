import { describe, expect, it } from "vitest";
import { applyCueDurationDelta } from "./linked-revision";
import type { PlanSnapshot } from "@/lib/agents/types";

const plan: PlanSnapshot = {
  segmentLabel: "节目",
  columns: [],
  rows: [
    { id: "c1", time: "0:00–0:10", durationSeconds: 10, music: "", speech: "", people: 1, lead: false, formationNote: "", visual: "", lighting: "", props: "" },
    { id: "c2", time: "0:10–0:20", durationSeconds: 10, music: "", speech: "", people: 1, lead: false, formationNote: "", visual: "", lighting: "", props: "" },
    { id: "c3", time: "0:20–0:30", durationSeconds: 10, music: "", speech: "", people: 1, lead: false, formationNote: "", visual: "", lighting: "", props: "" },
  ],
};

describe("applyCueDurationDelta", () => {
  it("extends one cue and shifts all following exact timecodes", () => {
    const revised = applyCueDurationDelta(plan, "c2", 8);
    expect(revised.rows.map((row) => row.time)).toEqual(["0:00–0:10", "0:10–0:28", "0:28–0:38"]);
    expect(plan.rows[2].time).toBe("0:20–0:30");
  });
});
