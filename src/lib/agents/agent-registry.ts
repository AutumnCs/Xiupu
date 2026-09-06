export type AgentDefinition = {
  id: string;
  title: string;
  role: string;
  reads: string[];
  writes: string[];
  stage: "creative" | "execution" | "revision";
};

export const AGENT_REGISTRY: AgentDefinition[] = [
  { id: "requirement-parser", title: "需求整理", role: "将项目原始资料归类为硬约束、创作空间与待确认问题。", reads: ["项目资料", "补充材料"], writes: ["结构化需求"], stage: "creative" },
  { id: "creative-director", title: "创意总监", role: "基于确认的需求与创作偏好提出差异化演绎方向。", reads: ["结构化需求", "项目上下文", "创作偏好"], writes: ["创意方向"], stage: "creative" },
  { id: "visual-director", title: "视觉导演", role: "将舞台参考图与限制转译为可编辑的视觉方向。", reads: ["视觉参考", "舞台限制", "品牌约束"], writes: ["视觉提示词", "视觉约束"], stage: "creative" },
  { id: "performance-composer", title: "演绎编导", role: "把选定方向写成完整演绎形式。", reads: ["项目资料", "结构化需求", "创意方向", "创作偏好"], writes: ["演绎形式"], stage: "creative" },
  { id: "plan-composer", title: "Cue 统筹", role: "将演绎形式拆成覆盖全节目的 Cue。", reads: ["演绎形式", "演员", "舞台条件", "项目资料"], writes: ["Cue 表", "部门执行字段"], stage: "execution" },
  { id: "feedback-analyst", title: "修改检查", role: "将导演反馈映射到受影响的段落、Cue 与部门。", reads: ["导演反馈", "演绎形式", "Cue 表"], writes: ["影响分析"], stage: "revision" },
  { id: "revision-composer", title: "修订编导", role: "只根据已确认影响生成下一版完整方案。", reads: ["反馈", "确认影响", "当前方案"], writes: ["V2 演绎形式", "V2 Cue"], stage: "revision" },
  { id: "consistency-checker", title: "一致性检查", role: "检查 Cue 在人数、道具、调度与执行字段中的冲突。", reads: ["Cue 表"], writes: ["一致性问题"], stage: "execution" },
];

export function getAgentDefinition(id: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find((agent) => agent.id === id);
}
