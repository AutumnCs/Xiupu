import type { PerformanceDraft, PlanRow, PlanSnapshot, VisualReferenceAnalysis } from "@/lib/agents/types";

export interface VisualLinkageResult {
  performance: PerformanceDraft;
  plan: PlanSnapshot;
  affectedCueIds: string[];
  skippedCueIds: string[];
}

function appendUnique(existing: string, addition: string): string {
  if (!addition.trim() || existing.includes(addition.trim())) return existing;
  return existing.trim() ? `${existing.trim()}；${addition.trim()}` : addition.trim();
}

function visualBrief(analysis: VisualReferenceAnalysis): string {
  const tags = analysis.styleTags.join("、");
  const palette = analysis.palette.join("、");
  const elements = analysis.stageElements.join("、");
  return [`风格：${tags}`, palette && `色彩：${palette}`, elements && `舞台：${elements}`].filter(Boolean).join("；");
}

function lightingBrief(analysis: VisualReferenceAnalysis): string {
  return analysis.lighting.length ? `参考灯光：${analysis.lighting.join("、")}` : "";
}

function updateSection(section: PerformanceDraft["sections"][number], analysis: VisualReferenceAnalysis) {
  const reference = `视觉参考：${analysis.prompt || analysis.summary}`;
  const lighting = lightingBrief(analysis);
  return {
    ...section,
    visual: appendUnique(section.visual, reference),
    lighting: appendUnique(section.lighting, lighting),
  };
}

function updateCue(row: PlanRow, analysis: VisualReferenceAnalysis): PlanRow {
  return {
    ...row,
    visual: appendUnique(row.visual, visualBrief(analysis)),
    lighting: appendUnique(row.lighting, lightingBrief(analysis)),
  };
}

export function applyVisualReferenceLinkage(
  performance: PerformanceDraft,
  plan: PlanSnapshot,
  analysis: VisualReferenceAnalysis,
): VisualLinkageResult {
  const nextPerformance: PerformanceDraft = {
    ...performance,
    sections: performance.sections.map((section) => updateSection(section, analysis)),
  };
  const affectedCueIds: string[] = [];
  const skippedCueIds: string[] = [];
  const nextPlan: PlanSnapshot = {
    ...plan,
    rows: plan.rows.map((row, index) => {
      const id = row.id || `cue-${index + 1}`;
      if (row.status === "confirmed" || row.status === "locked") {
        skippedCueIds.push(id);
        return { ...row };
      }
      affectedCueIds.push(id);
      return updateCue(row, analysis);
    }),
  };
  return { performance: nextPerformance, plan: nextPlan, affectedCueIds, skippedCueIds };
}
