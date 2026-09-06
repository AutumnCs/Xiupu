import { describe, expect, test } from "bun:test";

import { getCueIndexesForProgram, moveProgram } from "./program-workspace";

describe("program workspace helpers", () => {
  test("moves a program without mutating the original sequence", () => {
    const programs = ["武术", "中国舞", "歌曲"].map((title, index) => ({ id: `p${index + 1}`, title, type: "", chapter: "", notes: "" }));

    expect(moveProgram(programs, 2, -1).map((program) => program.title)).toEqual(["武术", "歌曲", "中国舞"]);
    expect(programs.map((program) => program.title)).toEqual(["武术", "中国舞", "歌曲"]);
  });

  test("finds original Cue indexes for a selected program", () => {
    const indexes = getCueIndexesForProgram([
      { time: "00:00–00:20", music: "", speech: "", people: 0, lead: false, formationNote: "", visual: "", lighting: "", props: "", programId: "p1" },
      { time: "00:20–00:40", music: "", speech: "", people: 0, lead: false, formationNote: "", visual: "", lighting: "", props: "", programId: "p2" },
      { time: "00:40–01:00", music: "", speech: "", people: 0, lead: false, formationNote: "", visual: "", lighting: "", props: "", programId: "p1" },
    ], "p1");

    expect(indexes).toEqual([0, 2]);
  });

  test("falls back to the program title when an AI Cue has no program id", () => {
    const indexes = getCueIndexesForProgram([
      { time: "00:00–00:20", music: "", speech: "", people: 0, lead: false, formationNote: "", visual: "", lighting: "", props: "", programTitle: "中国舞" },
    ], { id: "p2", title: "中国舞", type: "采茶舞", chapter: "夏长", notes: "" });

    expect(indexes).toEqual([0]);
  });
});
