import type { PlanSnapshot } from "@/lib/agents/types";

const FIELDS = ["time", "music", "speech", "formationNote", "visual", "lighting", "props", "camera", "notes"] as const;

export function hasLockedAffectedCue(plan: PlanSnapshot, cueIds: string[]): string[] {
  return plan.rows.filter((row) => row.id && cueIds.includes(row.id) && row.status === "locked").map((row) => row.id!);
}

export function summarizePlanChanges(base: PlanSnapshot, next: PlanSnapshot): Array<{ cue: number; fields: string[] }> {
  return next.rows.flatMap((row, index) => {
    const prior = base.rows[index];
    if (!prior) return [{ cue: index + 1, fields: ["新增 Cue"] }];
    const fields = FIELDS.filter((field) => String(prior[field] || "") !== String(row[field] || ""));
    return fields.length ? [{ cue: index + 1, fields }] : [];
  });
}
