import { describe, expect, it } from "vitest";
import { mergeClarificationsIntoBrief } from "./clarifications";

describe("mergeClarificationsIntoBrief", () => {
  it("appends answered clarification items while ignoring blanks", () => {
    expect(mergeClarificationsIntoBrief("节目时长 3 分钟", ["演员人数？  默认假设：12 人", "", "舞台？ 主舞台"])).toBe(
      "节目时长 3 分钟\n\n补充确认：演员人数？  默认假设：12 人；舞台？ 主舞台",
    );
  });
});
