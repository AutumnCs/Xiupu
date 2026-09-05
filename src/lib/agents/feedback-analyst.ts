import "server-only";
import { runAgentJSON } from "./run-agent";
import { FALLBACK_PROPOSALS } from "./preset-case";
import type { AgentResult, ChangeProposal, FieldEdit, PlanSnapshot } from "./types";

/**
 * 反馈解析 + 影响分析 Agent
 * 职责：解析导演的自然语言反馈，沿字段依赖定位受影响的行与列，
 * 输出可勾选的 ChangeProposal，并附带字段级修改指令（edits）。
 * 铁律：影响分析先于更新；只提出预览，不直接改方案。
 */

const VALID_FIELDS = ["time", "music", "speech", "people", "lead", "formationNote", "visual", "lighting", "props"];

const SYSTEM = `你是资深秀导助手，负责把导演反馈拆解为可确认的修改项。只输出 JSON。
输入包含当前方案表（若干行，每行有 time/music/speech/people/lead/formationNote/visual/lighting/props 字段）和导演的自然语言反馈。
要求：
- 把反馈拆成若干独立修改项，每项聚焦一个意图。
- 每项要沿字段依赖分析"联动影响"（例如改人数会联动队形、画面密度）。
- 每项给出字段级修改指令 edits：指定 rowIndex（从0开始的行号；若影响所有行用 -1）、field（上述字段名之一）、value（新值；people 用数字，lead 用布尔，其余用字符串）。
- 只修改反馈明确要求或直接联动的字段，不要擅自改动无关内容。
输出 JSON 严格为：{"proposals":[{"id":string,"title":string,"before":string,"after":string,"reason":string,"deps":[string],"edits":[{"rowIndex":number,"field":string,"value":string|number|boolean}]}]}。
id 用 p1/p2/...；deps 是受联动影响的方面（中文短词）。使用简体中文。`;

/** 校验 edits：字段合法、rowIndex 在范围内 */
function sanitizeEdits(edits: unknown, rowCount: number): FieldEdit[] {
  if (!Array.isArray(edits)) return [];
  return edits
    .filter((e): e is FieldEdit => !!e && typeof e === "object" && VALID_FIELDS.includes((e as FieldEdit).field))
    .map((e) => ({
      rowIndex: e.rowIndex === -1 || (Number.isInteger(e.rowIndex) && e.rowIndex >= 0 && e.rowIndex < rowCount) ? e.rowIndex : -1,
      field: e.field,
      value: e.field === "people" ? Number(e.value) || 1 : e.field === "lead" ? Boolean(e.value) : String(e.value),
    }));
}

export async function analyzeFeedback(input: {
  feedback: string;
  plan: PlanSnapshot;
  viewerUserId?: string;
}): Promise<AgentResult<ChangeProposal[]>> {
  const agent = "feedback-analyst";
  const planText = input.plan.rows
    .map((r, i) => `行${i}: 时间${r.time}｜人数${r.people}｜队形${r.formationNote}｜灯光${r.lighting}｜道具${r.props}｜视觉${r.visual}｜音乐${r.music}`)
    .join("\n");

  try {
    const { data, raw } = await runAgentJSON<{ proposals: ChangeProposal[] }>({
      system: SYSTEM,
      user: `当前方案表（共${input.plan.rows.length}行）：\n${planText}\n\n导演反馈：\n${input.feedback}`,
      viewerUserId: input.viewerUserId,
    });
    const list = Array.isArray(data.proposals) ? data.proposals : [];
    if (!list.length) throw new Error("未解析出修改项");
    const proposals: ChangeProposal[] = list.map((p, i) => ({
      id: p.id || `p${i + 1}`,
      title: String(p.title ?? "修改项"),
      before: String(p.before ?? ""),
      after: String(p.after ?? ""),
      reason: String(p.reason ?? ""),
      deps: Array.isArray(p.deps) ? p.deps.map(String) : [],
      edits: sanitizeEdits(p.edits, input.plan.rows.length),
    }));
    return { ok: true, agent, data: proposals, raw };
  } catch (err) {
    console.error("[feedback-analyst] fallback:", err);
    return { ok: true, agent, data: FALLBACK_PROPOSALS, fallback: true };
  }
}
