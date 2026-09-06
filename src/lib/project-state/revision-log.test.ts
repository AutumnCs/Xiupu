import { describe, expect, it } from "vitest";
import { hasLockedAffectedCue, summarizePlanChanges } from "./revision-log";
import type { PlanSnapshot } from "@/lib/agents/types";

const base: PlanSnapshot = { segmentLabel: "节目", columns: [], rows: [{ id: "c1", time: "0:00–0:10", music: "A", speech: "", people: 1, lead: false, formationNote: "", visual: "", lighting: "", props: "" }] };

describe("revision log", () => {
  it("warns before a revision touches a locked cue", () => {
    expect(hasLockedAffectedCue({ ...base, rows: [{ ...base.rows[0], status: "locked" }] }, ["c1"])).toEqual(["c1"]);
  });

  it("summarizes changed Cue fields for a readable version comparison", () => {
    expect(summarizePlanChanges(base, { ...base, rows: [{ ...base.rows[0], music: "B", lighting: "暖金" }] })).toEqual([{ cue: 1, fields: ["music", "lighting"] }]);
  });
});
