import { describe, expect, it } from "vitest";
import type { Program } from "@/lib/agents/types";
import { parseCueTable } from "./cue-import";

const programs: Program[] = [
  { id: "p1", title: "武术", type: "功夫舞棍", chapter: "春生", notes: "力量感" },
  { id: "p2", title: "中国舞", type: "采茶舞", chapter: "夏长", notes: "舒展" },
];

describe("parseCueTable", () => {
  it("imports a Markdown Cue table with exact time and program identity", () => {
    const plan = parseCueTable(`| 时间 | 音乐 | 演员 / 调度 | 视觉 | 灯光 | 道具 |
| --- | --- | --- | --- | --- | --- |
| 00:00–00:20 | 武术音乐起 | 武术演员后区进入 | 生长线条由地屏向LED延伸 | 中央定点光逐渐打开 | 棍 |
| 00:20–00:45 | 音乐转入舞蹈段 | 中国舞演员进入 | 明亮枝叶与流动色彩 | 明亮柔和面光 | 无 |`, programs, "四时生长");

    expect(plan.rows).toHaveLength(2);
    expect(plan.rows[0]).toMatchObject({ time: "00:00–00:20", durationSeconds: 20, visual: "生长线条由地屏向LED延伸", lighting: "中央定点光逐渐打开", props: "棍", programId: "p1", chapter: "春生" });
    expect(plan.rows[1]).toMatchObject({ time: "00:20–00:45", durationSeconds: 25, programId: "p2", programTitle: "中国舞" });
  });
});
