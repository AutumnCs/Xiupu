import "server-only";
import { runAgentJSON } from "./run-agent";
import { FALLBACK_DIRECTIONS } from "./preset-case";
import type { AgentResult, CreativeDirection, ProjectBrief, StructuredRequirement } from "./types";

/**
 * 创意生成 Agent
 * 职责：基于结构化需求，生成 3 个在身体机制、人物关系或空间构思上有实际区别的创意方向。
 */

const SYSTEM = `你是顶尖的舞台创意总监。基于给定的结构化需求，生成恰好 3 个差异化的秀演创意方向，只输出 JSON。
要求：
- 三个方向必须在身体机制、人物关系或空间构思上有实际区别，不能只是措辞不同。
- 尊重已确定项（硬约束），在可创作项上发挥。
- 每个方向包含：title(名称) / concept(核心概念一句话) / format(演绎形式) / arc(情绪曲线) / keyMoments(2个关键舞台时刻，含大致时间) / difficulty(难度：低/中/高)。
输出 JSON 结构严格为：{"directions":[{"id":string,"title":string,"concept":string,"format":string,"arc":string,"keyMoments":string,"difficulty":string}]}。
id 用 d1/d2/d3。使用简体中文。`;

export async function generateDirections(input: {
  requirement: StructuredRequirement;
  project?: ProjectBrief;
  viewerUserId?: string;
}): Promise<AgentResult<CreativeDirection[]>> {
  const agent = "creative-director";
  const reqText = [
    "已确定：" + input.requirement.fixed.join("；"),
    "可创作：" + input.requirement.creative.join("；"),
    "待确认：" + input.requirement.pending.join("；"),
  ].join("\n");

  try {
    const { data, raw } = await runAgentJSON<{ directions: CreativeDirection[] }>({
      system: SYSTEM,
      user: `结构化需求：\n${reqText}\n\n项目上下文：${input.project ? JSON.stringify({ projectName: input.project.projectName, programMaterial: input.project.programMaterial, stageConditions: input.project.stageConditions, creativeIntent: input.project.creativeIntent, supportingMaterials: input.project.supportingMaterials, creatorProfile: input.project.creatorProfile }) : "未提供"}`,
      viewerUserId: input.viewerUserId,
    });
    const directions = Array.isArray(data.directions) ? data.directions : [];
    if (directions.length < 3) throw new Error("创意方向不足 3 个");
    // 归一化 id
    const normalized = directions.slice(0, 3).map((d, i) => ({ ...d, id: `d${i + 1}` }));
    return { ok: true, agent, data: normalized, raw };
  } catch (err) {
    console.error("[creative-director] fallback:", err);
    return { ok: true, agent, data: FALLBACK_DIRECTIONS, fallback: true };
  }
}
