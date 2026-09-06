export function mergeClarificationsIntoBrief(brief: string, clarifications: string[]): string {
  const answered = clarifications.map((item) => item.trim()).filter(Boolean);
  if (!answered.length) return brief.trim();
  return `${brief.trim()}\n\n补充确认：${answered.join("；")}`;
}
