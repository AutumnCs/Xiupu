import { describe, expect, it } from "vitest";
import { getNextImpact } from "./impact-queue";
import type { ImpactReport } from "@/lib/agents/types";

const report: ImpactReport = {
  must: [{ id: "must-1", level: "must", title: "必须改", detail: "", sectionIds: [], cueIds: [], departments: [] }],
  maybe: [{ id: "maybe-1", level: "maybe", title: "可能改", detail: "", sectionIds: [], cueIds: [], departments: [] }],
  unaffected: [],
};

describe("getNextImpact", () => {
  it("returns the first unskipped must impact before maybe impacts", () => {
    expect(getNextImpact(report, new Set())).toMatchObject({ id: "must-1" });
    expect(getNextImpact(report, new Set(["must-1"]))).toMatchObject({ id: "maybe-1" });
  });
});
