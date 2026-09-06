import "server-only";
import { runVisionAgentJSON } from "./run-agent";
import type { AgentResult, CreativeDirection, ProjectBrief, VisualReferenceAnalysis } from "./types";

const SYSTEM = `你是舞台视觉总监，负责把参考图转译成可执行、可编辑的舞台视觉方向。
只输出 JSON，不要 Markdown。必须尊重项目约束：舞台条件、Logo/品牌要求、不可修改元素优先级最高。
不要臆造图片中看不清的内容；不确定的地方放入 uncertainties。prompt 要能直接作为后续舞美参考图生成的提示词，但本次不生成图片。
输出字段：summary(string), styleTags(string[]), palette(string[]), stageElements(string[]), lighting(string[]), preservedElements(string[]), constraints(string[]), prompt(string), uncertainties(string[])。`;

export async function analyzeVisualReference(input: {
  imageDataUrl: string;
  project: ProjectBrief;
  direction?: CreativeDirection;
  logoNotes: string;
  mustKeep: string;
  viewerUserId?: string;
}): Promise<AgentResult<VisualReferenceAnalysis>> {
  const user = JSON.stringify({
    project: input.project,
    creativeDirection: input.direction ?? null,
    logoNotes: input.logoNotes,
    mustKeep: input.mustKeep,
  });
  const { data, raw } = await runVisionAgentJSON<VisualReferenceAnalysis>({ system: SYSTEM, user, imageDataUrl: input.imageDataUrl, viewerUserId: input.viewerUserId });
  return { ok: true, agent: "visual-director", data, raw };
}
