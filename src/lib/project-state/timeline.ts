import type { PlanRow } from "@/lib/agents/types";

export function parseCueTimeRange(time: string): { startSeconds: number; durationSeconds: number } | null {
  const match = time.replace(/[–—]/g, "-").match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
  if (!match) return null;
  const startSeconds = Number(match[1]) * 60 + Number(match[2]);
  const endSeconds = Number(match[3]) * 60 + Number(match[4]);
  return endSeconds > startSeconds ? { startSeconds, durationSeconds: endSeconds - startSeconds } : null;
}

/**
 * 优先使用精确时间码；单节目 Demo 的段落型 Cue 则按粗略时长顺序铺开。
 * 这样时间轴仍表达相对节奏，但不会伪造音乐级 timecode。
 */
export function getCueTimelineRanges(rows: Array<Pick<PlanRow, "time" | "durationSeconds">>): Array<{ startSeconds: number; durationSeconds: number }> {
  let cursor = 0;
  return rows.map((row) => {
    const exact = parseCueTimeRange(row.time);
    if (exact) {
      cursor = exact.startSeconds + exact.durationSeconds;
      return exact;
    }
    const durationSeconds = Number.isFinite(row.durationSeconds) && (row.durationSeconds ?? 0) > 0
      ? Math.round(row.durationSeconds ?? 30)
      : 30;
    const range = { startSeconds: cursor, durationSeconds };
    cursor += durationSeconds;
    return range;
  });
}
