import "server-only";
import { runAgentJSON } from "./run-agent";
import { FALLBACK_REQUIREMENT } from "./preset-case";
import type { AgentResult, StructuredRequirement } from "./types";

/**
 * 需求解析 Agent
 * 职责：把导演的自然语言节目要求，解析成 已确定 / 可创作 / 待确认 三类结构化需求。
 * 原则：硬约束进 fixed；缺失或冲突进 pending，绝不静默猜测。
 */

const SYSTEM = `你是舞台秀演的资深需求分析师。请把导演提供的节目要求解析为三类结构化需求，并只输出 JSON。
分类定义：
- fixed（已确定）：明确给出的硬性事实与约束，例如节目类型、时长、主题、舞台条件、人数。生成不得违反。
- creative（可创作）：导演未固定、留给编导发挥的部分，例如演绎形式、队形、情绪曲线、视觉与灯光设计。
- pending（待确认）：信息缺失、含糊或相互冲突之处。每条必须写成用户能直接回答的问句，并在问句后写“默认假设：…”，绝不要静默替导演决定。
输出 JSON 结构严格为：{"fixed":[string],"creative":[string],"pending":[string]}。
每个数组 2-5 条，使用简体中文，条目简洁。`;

export async function parseRequirement(input: {
  brief: string;
  viewerUserId?: string;
}): Promise<AgentResult<StructuredRequirement>> {
  const agent = "requirement-parser";
  try {
    const { data, raw } = await runAgentJSON<StructuredRequirement>({
      system: SYSTEM,
      user: `节目要求原文：\n${input.brief}`,
      viewerUserId: input.viewerUserId,
    });
    // 基本校验：三个字段都应为数组
    if (!Array.isArray(data.fixed) || !Array.isArray(data.creative) || !Array.isArray(data.pending)) {
      throw new Error("需求解析结果结构不完整");
    }
    return { ok: true, agent, data, raw };
  } catch (err) {
    console.error("[requirement-parser] fallback:", err);
    return { ok: true, agent, data: FALLBACK_REQUIREMENT, fallback: true };
  }
}
