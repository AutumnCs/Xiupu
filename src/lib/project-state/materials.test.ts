import { describe, expect, it } from "vitest";
import { isTextMaterial } from "./materials";

describe("project materials", () => {
  it("accepts plain-text project files", () => {
    expect(isTextMaterial("节目单.md")).toBe(true);
    expect(isTextMaterial("requirements.txt")).toBe(true);
    expect(isTextMaterial("舞美参考.pdf")).toBe(false);
  });
});
