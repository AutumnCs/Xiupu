import "server-only";

import { runAgentJSON } from "./run-agent";
import { FALLBACK_PLAN } from "./preset-case";
import type { AgentResult, PerformanceDraft, PlanRow, PlanSnapshot, ProjectBrief } from "./types";

const SYSTEM = `你是舞台执行统筹，负责把完整单节目演绎形式拆成全节目 Cue 表，只输出 JSON。
每个演绎形式段落至少生成一条 Cue，按节目顺序覆盖开场到结尾。时间字段用“开场｜约30秒”这类段落节点和粗略时长，durationSeconds 是正整数估计秒数，不使用精确 timecode。
每条 Cue 必填：id、sectionId、programId、programTitle、chapter、durationSeconds、time、music、speech、people、lead、formationNote、visual、lighting、props、camera、notes。programId 和 chapter 必须对应输入节目单。
输出：{"segmentLabel":string,"rows":[...] }。使用简体中文。`;

function sanitize(rows: PlanRow[], performance: PerformanceDraft): PlanRow[] {
  return rows.filter((row) => row && typeof row.time === "string").map((row, index) => ({
    id: `c${index + 1}`,
    sectionId: performance.sections.find((section) => section.id === row.sectionId)?.id ?? performance.sections[Math.min(index, performance.sections.length - 1)]?.id,
    programId: row.programId, programTitle: row.programTitle, chapter: row.chapter,
    durationSeconds: Number.isFinite(Number(row.durationSeconds)) && Number(row.durationSeconds) > 0 ? Number(row.durationSeconds) : 30,
    time: String(row.time), music: String(row.music ?? "待确认音乐"), speech: String(row.speech ?? "（无台词）"),
    people: Number.isInteger(row.people) && row.people > 0 ? row.people : 1, lead: Boolean(row.lead),
    formationNote: String(row.formationNote ?? "待确认调度"), visual: String(row.visual ?? "待确认视觉"),
    lighting: String(row.lighting ?? "待确认灯光"), props: String(row.props ?? "无"), camera: String(row.camera ?? "待确认"), notes: String(row.notes ?? ""),
  }));
}

export async function composePlan(input: { performance: PerformanceDraft; project: ProjectBrief; viewerUserId?: string }): Promise<AgentResult<PlanSnapshot>> {
  try {
    const { data, raw } = await runAgentJSON<{ segmentLabel: string; rows: PlanRow[] }>({
      system: SYSTEM,
      user: `项目：${input.project.projectName}\n节目资料：${input.project.programMaterial}\n独立节目单：${JSON.stringify(input.project.programs || [])}\n演员：${input.project.performers}\n舞台：${input.project.stageConditions}\n补充资料：${input.project.supportingMaterials || "无"}\n创作者偏好（仅建议，不得覆盖硬约束）：${JSON.stringify(input.project.creatorProfile || null)}\n\n演绎形式：${JSON.stringify(input.performance)}`,
      viewerUserId: input.viewerUserId,
      params: { max_tokens: 2400, temperature: 0.5 },
    });
    const rows = sanitize(Array.isArray(data.rows) ? data.rows : [], input.performance);
    if (rows.length < input.performance.sections.length) throw new Error("Cue 不足以覆盖演绎形式");
    return { ok: true, agent: "plan-composer", data: { segmentLabel: data.segmentLabel || `完整节目 Cue · ${input.performance.title}`, columns: FALLBACK_PLAN.columns, rows }, raw };
  } catch (error) {
    console.error("[plan-composer] fallback:", error);
    return { ok: true, agent: "plan-composer", data: FALLBACK_PLAN, fallback: true };
  }
}
