import type { PlanRow, PlanSnapshot, Program } from "@/lib/agents/types";
import { parseCueTimeRange } from "./timeline";

const HEADER_ALIASES: Record<string, keyof PlanRow | "formation"> = {
  "时间": "time", "时间码": "time", "time": "time",
  "音乐": "music", "音乐/段落": "music", "music": "music",
  "台词": "speech", "歌词": "speech", "台词/歌词": "speech", "speech": "speech",
  "演员/调度": "formation", "演员": "formation", "人员/调度": "formation", "调度": "formation",
  "视觉": "visual", "led": "visual", "地屏": "visual", "视觉/led": "visual",
  "灯光": "lighting", "lighting": "lighting",
  "道具": "props", "props": "props",
  "镜头": "camera", "camera": "camera", "备注": "notes", "执行备注": "notes", "notes": "notes",
  "节目": "programTitle", "所属节目": "programTitle", "篇章": "chapter", "所属篇章": "chapter",
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/[｜|]/g, "/");
}

function parseGrid(text: string): string[][] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const tableLines = lines.filter((line) => line.includes("|") || line.includes("\t"));
  return tableLines.map((line) => {
    const cells = line.includes("\t") ? line.split("\t") : line.replace(/^\||\|$/g, "").split("|");
    return cells.map((cell) => cell.trim());
  }).filter((cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

function matchProgram(row: PlanRow, programs: Program[]): Program | undefined {
  if (row.programTitle) return programs.find((program) => program.title === row.programTitle || program.type === row.programTitle);
  const text = [row.music, row.speech, row.formationNote, row.props, row.visual].join(" ");
  return programs.find((program) => [program.title, program.type].filter(Boolean).some((keyword) => keyword.length >= 2 && text.includes(keyword)));
}

export function parseCueTable(text: string, programs: Program[] = [], segmentLabel = "导入 Cue 表"): PlanSnapshot {
  const grid = parseGrid(text);
  if (grid.length < 2) throw new Error("cue_table_empty");
  const headers = grid[0].map((header) => HEADER_ALIASES[normalizeHeader(header)]);
  if (!headers.includes("time")) throw new Error("cue_time_required");
  const rows = grid.slice(1).map((cells, index) => {
    const row: PlanRow = { id: `c${index + 1}`, time: "", music: "", speech: "", people: 0, lead: false, formationNote: "", visual: "", lighting: "", props: "", camera: "", notes: "", status: "draft" };
    cells.forEach((cell, cellIndex) => {
      const field = headers[cellIndex];
      if (!field || !cell) return;
      if (field === "formation") row.formationNote = cell;
      else if (field === "people") row.people = Number(cell) || 0;
      else (row[field] as string | undefined) = cell;
    });
    const range = parseCueTimeRange(row.time);
    if (range) row.durationSeconds = range.durationSeconds;
    const program = matchProgram(row, programs);
    if (program) { row.programId = program.id; row.programTitle = program.title; row.chapter = row.chapter || program.chapter; }
    return row;
  }).filter((row) => row.time);
  if (!rows.length) throw new Error("cue_rows_empty");
  return { segmentLabel, columns: ["program", "time", "music", "speech", "formation", "visual", "lighting", "props", "camera", "notes"], rows };
}
