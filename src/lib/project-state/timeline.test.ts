import { describe, expect, it } from "vitest";
import { parseCueTimeRange } from "./timeline";

describe("parseCueTimeRange", () => {
  it("turns a cue timecode into a start and duration", () => {
    expect(parseCueTimeRange("2:12–2:28")).toEqual({ startSeconds: 132, durationSeconds: 16 });
  });
});
