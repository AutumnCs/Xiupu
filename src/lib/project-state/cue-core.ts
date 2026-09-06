import type { PlanSnapshot } from "@/lib/agents/types";

export type CueStatus = "draft" | "ready" | "confirmed" | "locked";

export function getCueContext(plan: PlanSnapshot, index: number): { previous: string | null; next: string | null } {
  const format = (rowIndex: number) => {
    const row = plan.rows[rowIndex];
    return row ? `Cue ${rowIndex + 1} · ${row.time}` : null;
  };
  return { previous: format(index - 1), next: format(index + 1) };
}

export function updateCueStatus(plan: PlanSnapshot, index: number, status: CueStatus): PlanSnapshot {
  if (!plan.rows[index]) return plan;
  return { ...plan, rows: plan.rows.map((row, rowIndex) => rowIndex === index ? { ...row, status } : row) };
}
