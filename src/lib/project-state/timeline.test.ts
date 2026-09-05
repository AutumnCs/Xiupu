import { describe, expect, it } from "vitest";
import { getCueTimelineRanges, parseCueTimeRange } from "./timeline";

describe("parseCueTimeRange", () => {
  it("turns a cue timecode into a start and duration", () => {
    expect(parseCueTimeRange("2:12–2:28")).toEqual({ startSeconds: 132, durationSeconds: 16 });
  });

  it("lays rough section cues out sequentially without inventing timecodes", () => {
    expect(getCueTimelineRanges([
      { time: "开场｜约30秒", durationSeconds: 30 },
      { time: "发展｜约45秒", durationSeconds: 45 },
    ])).toEqual([
      { startSeconds: 0, durationSeconds: 30 },
      { startSeconds: 30, durationSeconds: 45 },
    ]);
  });
});
