import { describe, expect, test } from "bun:test";

import { buildDepartmentCueSheet } from "./department-export";

describe("buildDepartmentCueSheet", () => {
  test("formats a shareable department cue sheet with program context", () => {
    const output = buildDepartmentCueSheet({
      projectName: "四时生长",
      departmentName: "灯光",
      versionName: "V2",
      entries: [{ cue: 2, time: "00:20–00:45", program: "中国舞", chapter: "夏长", status: "已确认", content: "侧光转暖，追随群舞入场。" }],
    });

    expect(output).toContain("# 四时生长｜灯光 Cue 单");
    expect(output).toContain("版本：V2");
    expect(output).toContain("节目 / 篇章：中国舞｜夏长");
    expect(output).toContain("执行状态：已确认");
  });
});
