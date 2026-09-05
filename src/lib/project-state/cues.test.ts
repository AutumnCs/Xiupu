import { describe, expect, it } from "vitest";
import { formatCueTimecode } from "./cues";

describe("cue timing", () => {
  it("derives an end timecode from a start and duration", () => {
    expect(formatCueTimecode(60, 12)).toBe("1:00–1:12");
  });
});
