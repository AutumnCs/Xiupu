import type { PlanSnapshot, PlanRow } from "@/lib/agents/types";

export type EditableCueField = Exclude<keyof PlanRow, "people" | "lead"> | "formation";

/** Updates a Cue immutably so every derived workspace view can react to the same snapshot. */
export function updatePlanRow(
  plan: PlanSnapshot,
  rowIndex: number,
  field: EditableCueField,
  value: string,
): PlanSnapshot {
  if (!plan.rows[rowIndex]) return plan;
  const key = field === "formation" ? "formationNote" : field;
  return {
    ...plan,
    rows: plan.rows.map((row, index) => index === rowIndex ? { ...row, [key]: value } : row),
  };
}
