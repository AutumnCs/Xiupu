import type { PlanRow, Program } from "@/lib/agents/types";

export function moveProgram(programs: Program[], index: number, offset: -1 | 1): Program[] {
  const target = index + offset;
  if (target < 0 || target >= programs.length) return programs;
  const next = [...programs];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function getCueIndexesForProgram(rows: PlanRow[], program: Pick<Program, "id" | "title"> | string | null): number[] {
  if (!program) return rows.map((_, index) => index);
  const programId = typeof program === "string" ? program : program.id;
  const programTitle = typeof program === "string" ? "" : program.title.trim();
  return rows.flatMap((row, index) => row.programId === programId || (!!programTitle && row.programTitle === programTitle) ? [index] : []);
}
