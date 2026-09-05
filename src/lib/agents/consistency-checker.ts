import "server-only";
import { runAgentJSON } from "./run-agent";
import type { AgentResult, ValidationIssue, PlanSnapshot, PlanRow } from "./types";

/**
 * 一致性检查 Agent（节点 4）
 * 铁律：确定性规则优先（稳定、可复现），AI 补充语义检查。
 * 时间段连续、人数为正整数、队形描述与人数一致、道具删除后不应再被引用等。
 */

/** 把 "2:00–2:12" / "2:00-2:12" 解析成 [start,end] 秒 */
function parseTime(t: string): [number, number] | null {
  const m = t.replace(/[–—]/g, "-").match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
  if (!m) return null;
  const s = Number(m[1]) * 60 + Number(m[2]);
  const e = Number(m[3]) * 60 + Number(m[4]);
  return [s, e];
}

/** 提取队形描述中的人数（如 "8人紧凑 V 字" → 8） */
function peopleInNote(note: string): number | null {
  const m = note.match(/(\d+)\s*人/);
  return m ? Number(m[1]) : null;
}

/** 确定性规则检查 —— 稳定可复现 */
function runRules(rows: PlanRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let prevEnd: number | null = null;

  rows.forEach((r, i) => {
    // 人数为正整数
    if (!Number.isInteger(r.people) || r.people <= 0) {
      issues.push({ severity: "error", rowIndex: i, field: "people", message: `第${i + 1}段人数无效（${r.people}）`, suggestion: "人数应为正整数", source: "rule" });
    }
    // 队形描述人数与 people 字段一致
    const notePeople = peopleInNote(r.formationNote);
    if (notePeople !== null && notePeople !== r.people) {
      issues.push({ severity: "warning", rowIndex: i, field: "formationNote", message: `第${i + 1}段队形描述为${notePeople}人，但人数字段为${r.people}人`, suggestion: `将队形描述改为${r.people}人`, source: "rule" });
    }
    // 时间格式与连续性
    const tr = parseTime(r.time);
    if (!tr) {
      issues.push({ severity: "warning", rowIndex: i, field: "time", message: `第${i + 1}段时间码格式无法解析（${r.time}）`, source: "rule" });
    } else {
      const [start, end] = tr;
      if (end <= start) {
        issues.push({ severity: "error", rowIndex: i, field: "time", message: `第${i + 1}段结束时间不晚于开始时间`, source: "rule" });
      }
      if (prevEnd !== null && start !== prevEnd) {
        issues.push({ severity: "warning", rowIndex: i, field: "time", message: `第${i + 1}段起始时间与上一段结束时间不连续`, suggestion: "检查时间段是否有间隙或重叠", source: "rule" });
      }
      prevEnd = end;
    }
  });

  // 跨行：道具已移除但仍被其它字段引用
  const propsRemoved = rows.every((r) => /无.*道具|移除|不使用/.test(r.props));
  if (propsRemoved) {
    rows.forEach((r, i) => {
      if (/道具|发光棒|手持/.test(r.visual) || /道具|发光棒|手持/.test(r.formationNote)) {
        issues.push({ severity: "warning", rowIndex: i, message: `第${i + 1}段已移除道具，但视觉或队形描述仍提及道具`, suggestion: "同步更新相关描述", source: "rule" });
      }
    });
  }

  return issues;
}

const SYSTEM = `你是舞台方案的一致性审校专家。审查给定的图文方案表，找出确定性规则难以覆盖的语义问题，只输出 JSON。
关注：情绪曲线是否连贯、灯光与音乐是否匹配段落情绪、视觉与队形是否呼应、结尾是否达成要求的效果、专业内容之间是否矛盾。
不要重复明显的数值/格式问题（那些由规则引擎处理）。
输出 JSON 严格为：{"issues":[{"severity":"warning"|"info","rowIndex":number,"field":string,"message":string,"suggestion":string}]}。
rowIndex 从0开始，跨行问题用 -1。最多 5 条，使用简体中文。若无语义问题返回空数组。`;

export async function validatePlan(input: {
  plan: PlanSnapshot;
  viewerUserId?: string;
}): Promise<AgentResult<ValidationIssue[]>> {
  const agent = "consistency-checker";
  const ruleIssues = runRules(input.plan.rows);

  // AI 语义检查（失败不影响规则结果）
  let aiIssues: ValidationIssue[] = [];
  let raw = "";
  try {
    const planText = input.plan.rows
      .map((r, i) => `行${i}: 时间${r.time}｜人数${r.people}｜队形${r.formationNote}｜音乐${r.music}｜灯光${r.lighting}｜视觉${r.visual}｜道具${r.props}`)
      .join("\n");
    const res = await runAgentJSON<{ issues: Omit<ValidationIssue, "source">[] }>({
      system: SYSTEM,
      user: `方案表（共${input.plan.rows.length}行）：\n${planText}`,
      viewerUserId: input.viewerUserId,
    });
    raw = "ai-ok";
    aiIssues = (Array.isArray(res.data.issues) ? res.data.issues : [])
      .slice(0, 5)
      .map((x) => ({
        severity: (x.severity === "info" ? "info" : "warning") as ValidationIssue["severity"],
        rowIndex: Number.isInteger(x.rowIndex) ? x.rowIndex : -1,
        field: x.field ? String(x.field) : undefined,
        message: String(x.message ?? ""),
        suggestion: x.suggestion ? String(x.suggestion) : undefined,
        source: "ai" as const,
      }))
      .filter((x) => x.message);
  } catch (err) {
    console.error("[consistency-checker] AI check skipped:", err);
  }

  // 规则问题在前（更确定），AI 语义问题在后
  return { ok: true, agent, data: [...ruleIssues, ...aiIssues], raw };
}
