import type { Program } from "@/lib/agents/types";

function valueAfterLabel(block: string, label: string): string {
  return block.match(new RegExp(`${label}[：:]\\s*([^\\n]+)`))?.[1]?.trim() || "";
}

export function inferProgramsFromMaterial(material: string): Program[] {
  const lines = material.split(/\r?\n/);
  const starts = lines.map((line, index) => ({ line: line.trim(), index })).filter(({ line }) => /^#{1,6}\s+/.test(line));
  const programs: Program[] = [];
  for (const heading of starts) {
    const rawTitle = heading.line.replace(/^#{1,6}\s+/, "").replace(/节目$/, "").trim();
    if (!rawTitle || /^(节目资料|项目背景|导演|甲方|素材)$/i.test(rawTitle)) continue;
    const next = starts.find((candidate) => candidate.index > heading.index);
    const block = lines.slice(heading.index + 1, next?.index ?? lines.length).join("\n");
    const type = valueAfterLabel(block, "形式");
    const notes = valueAfterLabel(block, "特点") || compactBlock(block);
    if (!type && !notes) continue;
    programs.push({ id: `p${programs.length + 1}`, title: rawTitle, type, chapter: "", notes });
  }
  return programs;
}

function compactBlock(block: string): string {
  return block.replace(/\s+/g, " ").trim().slice(0, 120);
}
