import { describe, expect, it } from "vitest";
import { createRequirementItem, toggleRequirementLock } from "./requirements";

describe("project requirements", () => {
  it("creates an editable unlocked requirement item", () => {
    expect(createRequirementItem("fixed", "8 名演员")).toMatchObject({
      tone: "fixed",
      text: "8 名演员",
      locked: false,
    });
  });

  it("locks an existing requirement without changing its content", () => {
    expect(toggleRequirementLock({ id: "r1", tone: "fixed", text: "8 名演员", locked: false }))
      .toEqual({ id: "r1", tone: "fixed", text: "8 名演员", locked: true });
  });
});
