import "server-only";

import { runAgentJSON } from "./run-agent";
import { FALLBACK_IMPACT } from "./preset-case";
import type { AgentResult, ImpactItem, ImpactReport, PerformanceDraft, PlanSnapshot } from "./types";

const SYSTEM = `你是秀导会议后的影响分析助手。根据导演反馈、演绎形式和 Cue 表，只输出 JSON。
把影响分为 must（反馈明确要求，必须改）、maybe（可能被联动影响，需人工决定）、unaffected（明确不受影响）。每项给 id、title、detail、sectionIds、cueIds、departments。sectionIds 和 cueIds 必须来自输入。输出：{"must":[],"maybe":[],"unaffected":[]}。使用简体中文。`;

function normalize(items: unknown, level: ImpactItem["level"], performance: PerformanceDraft, plan: PlanSnapshot): ImpactItem[] {
  if (!Array.isArray(items)) return [];
  const sections = new Set(performance.sections.map((section) => section.id));
  const cues = new Set(plan.rows.map((row, index) => row.id || `c${index + 1}`));
  return items.slice(0, 6).map((item, index) => {
    const source = item as Partial<ImpactItem>;
    return {
      id: String(source.id || `${level}-${index + 1}`), level, title: String(source.title || "相关内容"), detail: String(source.detail || "需要秀导确认。"),
      sectionIds: Array.isArray(source.sectionIds) ? source.sectionIds.map(String).filter((id) => sections.has(id)) : [],
      cueIds: Array.isArray(source.cueIds) ? source.cueIds.map(String).filter((id) => cues.has(id)) : [],
      departments: Array.isArray(source.departments) ? source.departments.map(String) : [],
    };
  });
}

export async function analyzeFeedback(input: { feedback: string; performance: PerformanceDraft; plan: PlanSnapshot; viewerUserId?: string }): Promise<AgentResult<ImpactReport>> {
  try {
    const { data, raw } = await runAgentJSON<ImpactReport>({
      system: SYSTEM,
      user: `演绎形式：${JSON.stringify(input.performance)}\nCue表：${JSON.stringify(input.plan.rows)}\n\n导演反馈：${input.feedback}`,
      viewerUserId: input.viewerUserId,
    });
    const report = {
      must: normalize(data.must, "must", input.performance, input.plan),
      maybe: normalize(data.maybe, "maybe", input.performance, input.plan),
      unaffected: normalize(data.unaffected, "unaffected", input.performance, input.plan),
    };
    if (!report.must.length && !report.maybe.length && !report.unaffected.length) throw new Error("影响项为空");
    return { ok: true, agent: "feedback-analyst", data: report, raw };
  } catch (error) {
    console.error("[feedback-analyst] fallback:", error);
    return { ok: true, agent: "feedback-analyst", data: FALLBACK_IMPACT, fallback: true };
  }
}
