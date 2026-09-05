import "server-only";

import { runAgentJSON } from "./run-agent";
import { FALLBACK_PERFORMANCE } from "./preset-case";
import type { AgentResult, CreativeDirection, PerformanceDraft, ProjectBrief, StructuredRequirement } from "./types";

const SYSTEM = `你是秀导的执行型副导演。基于项目资料和选定创意方向，写一份完整单节目演绎形式，只输出 JSON。
必须包含从开场到结尾的5个连续段落：开场、发展、转场、高潮、结尾。每段写清舞台过程、演员调度、视觉和灯光方向，并给出“约20秒”这类粗略时长。不要生成精确音乐时间码。
输出：{"title":string,"theme":string,"overview":string,"sections":[{"id":"s1","label":string,"durationLabel":string,"staging":string,"blocking":string,"visual":string,"lighting":string}]}。使用简体中文。`;

export async function composePerformance(input: { project: ProjectBrief; requirement: StructuredRequirement; direction: CreativeDirection; viewerUserId?: string }): Promise<AgentResult<PerformanceDraft>> {
  try {
    const { data, raw } = await runAgentJSON<PerformanceDraft>({
      system: SYSTEM,
      user: `项目：${input.project.projectName}\n导演要求：${input.project.directorRequirements}\n节目资料：${input.project.programMaterial}\n演员：${input.project.performers}\n舞台：${input.project.stageConditions}\n用户创意：${input.project.creativeIntent}\n\n创意方向：${input.direction.title}｜${input.direction.concept}｜${input.direction.format}\n\n已确定要求：${input.requirement.fixed.join("；")}`,
      viewerUserId: input.viewerUserId,
    });
    const sections = Array.isArray(data.sections) ? data.sections.slice(0, 6).map((section, index) => ({
      id: `s${index + 1}`,
      label: String(section.label || `第${index + 1}段`), durationLabel: String(section.durationLabel || "约30秒"),
      staging: String(section.staging || "待补充"), blocking: String(section.blocking || "待补充"),
      visual: String(section.visual || "待补充"), lighting: String(section.lighting || "待补充"),
    })) : [];
    if (sections.length < 5) throw new Error("演绎形式段落不足");
    return { ok: true, agent: "performance-composer", data: { title: String(data.title || input.direction.title), theme: String(data.theme || input.direction.concept), overview: String(data.overview || ""), sections }, raw };
  } catch (error) {
    console.error("[performance-composer] fallback:", error);
    return { ok: true, agent: "performance-composer", data: FALLBACK_PERFORMANCE, fallback: true };
  }
}
