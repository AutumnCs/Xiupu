function formatSeconds(seconds: number): string {
  const normalized = Math.max(0, Math.floor(seconds));
  return `${Math.floor(normalized / 60)}:${String(normalized % 60).padStart(2, "0")}`;
}

export function formatCueTimecode(startSeconds: number, durationSeconds: number): string {
  return `${formatSeconds(startSeconds)}–${formatSeconds(startSeconds + durationSeconds)}`;
}
