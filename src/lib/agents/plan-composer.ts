import "server-only";
import { runAgentJSON } from "./run-agent";
import { FALLBACK_PLAN } from "./preset-case";
import type { AgentResult, PlanSnapshot, PlanRow, CreativeDirection, StructuredRequirement } from "./types";

/**
 * 多专业方案生成 Agent（节目拆解 + 逐段专业内容）
 * 职责：把选定创意方向拆成一个聚焦片段（30–60秒、5–8行），
 * 每行生成 7 列专业内容：时间码/音乐/台词/人员队形/视觉/灯光/道具。
 * 确定性规则：人数为正整数、时间段连续。语义交给模型。
 */

const SYSTEM = `你是资深秀导，负责把创意方向拆解为可执行的图文方案表。只输出 JSON。
要求：
- 聚焦节目中一个 30–60 秒的关键片段（通常是高潮/爆发段），拆成 4–6 个连续时间段。
- 尊重已确定项（硬约束，尤其人数与舞台条件），在可创作项上发挥。
- 每个时间段（行）包含 7 个字段：
  time(时间码，如"2:00–2:12")/music(音乐或段落)/speech(歌词或台词，无则写"（无台词）")/
  people(该段人数，正整数)/lead(该段是否有领舞居中亮相，布尔)/formationNote(队形一句话描述)/
  visual(主屏视觉)/lighting(灯光)/props(道具)。
输出 JSON 严格为：{"segmentLabel":string,"rows":[{"time":string,"music":string,"speech":string,"people":number,"lead":boolean,"formationNote":string,"visual":string,"lighting":string,"props":string}]}。
segmentLabel 描述所选片段，如"选定片段：高潮·爆发段（120s–180s）"。使用简体中文。`;

/** 确定性校验：修正非正整数人数、保证行结构完整 */
function sanitize(rows: PlanRow[]): PlanRow[] {
  return rows
    .filter((r) => r && typeof r.time === "string")
    .map((r) => ({
      time: String(r.time),
      music: String(r.music ?? ""),
      speech: String(r.speech ?? "（无台词）"),
      people: Number.isInteger(r.people) && r.people > 0 ? r.people : 1,
      lead: Boolean(r.lead),
      formationNote: String(r.formationNote ?? ""),
      visual: String(r.visual ?? ""),
      lighting: String(r.lighting ?? ""),
      props: String(r.props ?? ""),
    }));
}

export async function composePlan(input: {
  direction: CreativeDirection;
  requirement?: StructuredRequirement | null;
  viewerUserId?: string;
}): Promise<AgentResult<PlanSnapshot>> {
  const agent = "plan-composer";
  const reqText = input.requirement
    ? `已确定：${input.requirement.fixed.join("；")}\n可创作：${input.requirement.creative.join("；")}`
    : "（无结构化需求，按方向自行合理设定）";
  const dir = input.direction;

  try {
    const { data, raw } = await runAgentJSON<{ segmentLabel: string; rows: PlanRow[] }>({
      system: SYSTEM,
      user: `选定创意方向：\n名称：${dir.title}\n概念：${dir.concept}\n形式：${dir.format}\n情绪曲线：${dir.arc}\n关键时刻：${dir.keyMoments}\n\n${reqText}`,
      viewerUserId: input.viewerUserId,
    });
    const rows = sanitize(Array.isArray(data.rows) ? data.rows : []);
    if (rows.length < 3) throw new Error("方案行数不足");
    const snapshot: PlanSnapshot = {
      segmentLabel: data.segmentLabel || "选定片段",
      columns: FALLBACK_PLAN.columns,
      rows,
    };
    return { ok: true, agent, data: snapshot, raw };
  } catch (err) {
    console.error("[plan-composer] fallback:", err);
    return { ok: true, agent, data: FALLBACK_PLAN, fallback: true };
  }
}
