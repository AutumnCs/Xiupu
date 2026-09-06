export type DepartmentCueSheetEntry = {
  cue: number;
  time: string;
  program?: string;
  chapter?: string;
  status: string;
  content: string;
};

export function buildDepartmentCueSheet(input: {
  projectName: string;
  departmentName: string;
  versionName: string;
  entries: DepartmentCueSheetEntry[];
}): string {
  const title = input.projectName.trim() || "未命名项目";
  const details = input.entries.map((entry) => {
    const programContext = [entry.program, entry.chapter].filter(Boolean).join("｜") || "—";
    return [
      `## Cue ${entry.cue}｜${entry.time}`,
      `- 节目 / 篇章：${programContext}`,
      `- 执行状态：${entry.status}`,
      "",
      entry.content.trim(),
    ].join("\n");
  });

  return [
    `# ${title}｜${input.departmentName} Cue 单`,
    "",
    `版本：${input.versionName}`,
    `共 ${input.entries.length} 条执行项`,
    "",
    "---",
    "",
    ...details,
  ].join("\n\n");
}
