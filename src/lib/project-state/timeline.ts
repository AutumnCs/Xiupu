export function parseCueTimeRange(time: string): { startSeconds: number; durationSeconds: number } | null {
  const match = time.replace(/[–—]/g, "-").match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
  if (!match) return null;
  const startSeconds = Number(match[1]) * 60 + Number(match[2]);
  const endSeconds = Number(match[3]) * 60 + Number(match[4]);
  return endSeconds > startSeconds ? { startSeconds, durationSeconds: endSeconds - startSeconds } : null;
}
