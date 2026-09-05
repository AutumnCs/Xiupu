import { formatCueTimecode } from "./cues";
import { parseCueTimeRange } from "./timeline";
import type { PlanSnapshot } from "@/lib/agents/types";

/** Applies a duration change to one cue and propagates exact timecode shifts downstream. */
export function applyCueDurationDelta(plan: PlanSnapshot, cueId: string, deltaSeconds: number): PlanSnapshot {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds === 0) return plan;
  const targetIndex = plan.rows.findIndex((row, index) => (row.id || `c${index + 1}`) === cueId);
  if (targetIndex < 0) return plan;
  const rows = plan.rows.map((row) => ({ ...row }));
  const targetRange = parseCueTimeRange(rows[targetIndex].time);
  if (targetRange) {
    rows[targetIndex].time = formatCueTimecode(targetRange.startSeconds, targetRange.durationSeconds + deltaSeconds);
    rows[targetIndex].durationSeconds = Math.max(1, (rows[targetIndex].durationSeconds ?? targetRange.durationSeconds) + deltaSeconds);
    for (let index = targetIndex + 1; index < rows.length; index += 1) {
      const range = parseCueTimeRange(rows[index].time);
      if (range) rows[index].time = formatCueTimecode(range.startSeconds + deltaSeconds, range.durationSeconds);
    }
  } else {
    rows[targetIndex].durationSeconds = Math.max(1, (rows[targetIndex].durationSeconds ?? 30) + deltaSeconds);
    rows[targetIndex].time = rows[targetIndex].time.replace(/约\s*\d+\s*秒/, `约${rows[targetIndex].durationSeconds}秒`);
  }
  return { ...plan, rows };
}
