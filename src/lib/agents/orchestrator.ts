import "server-only";
import { parseRequirement } from "./requirement-parser";
import { generateDirections } from "./creative-director";
import { composePerformance } from "./performance-composer";
import { composePlan } from "./plan-composer";
import { analyzeFeedback } from "./feedback-analyst";
import { composeRevision } from "./revision-composer";
import { validatePlan } from "./consistency-checker";
import { analyzeVisualReference } from "./visual-director";
import type {
  AgentResult,
  StructuredRequirement,
  CreativeDirection,
  PlanSnapshot,
  ProjectBrief,
  PerformanceDraft,
  ImpactReport,
  ImpactItem,
  RevisionSnapshot,
  ValidationIssue,
  VisualReferenceAnalysis,
} from "./types";

/**
 * 编排器（Orchestrator）
 * ----------------------------------------------------------------------------
 * StageMuse 是「编排器 + 专职 Agent」架构，每个阶段是独立可替换的节点。
 * 关键铁律：AI 只负责生成/检查/联动；每个节点产出先进草稿态，由秀导确认后才进入下一步。
 *
 * 当前单节目闭环节点：
 *   1) requirement  —— 需求解析
 *   2) directions   —— 创意方向
 *   3) performance  —— 完整演绎形式
 *   4) plan         —— 全节目 Cue
 *   5) feedback     —— 影响分析
 *   6) revision     —— 确认后重建 V2
 *   7) validate     —— 一致性检查（确定性规则优先 + AI 语义）
 * ----------------------------------------------------------------------------
 */

export const orchestrator = {
  /** 节点 1：需求解析 */
  async runRequirement(brief: string, viewerUserId?: string): Promise<AgentResult<StructuredRequirement>> {
    return parseRequirement({ brief, viewerUserId });
  },

  /** 节点 2：创意生成 */
  async runDirections(requirement: StructuredRequirement, project?: ProjectBrief, viewerUserId?: string): Promise<AgentResult<CreativeDirection[]>> {
    return generateDirections({ requirement, project, viewerUserId });
  },

  async runVisualReference(input: Parameters<typeof analyzeVisualReference>[0], viewerUserId?: string): Promise<AgentResult<VisualReferenceAnalysis>> {
    return analyzeVisualReference({ ...input, viewerUserId });
  },

  async runPerformance(project: ProjectBrief, requirement: StructuredRequirement, direction: CreativeDirection, viewerUserId?: string): Promise<AgentResult<PerformanceDraft>> {
    return composePerformance({ project, requirement, direction, viewerUserId });
  },

  async runPlan(performance: PerformanceDraft, project: ProjectBrief, viewerUserId?: string): Promise<AgentResult<PlanSnapshot>> {
    return composePlan({ performance, project, viewerUserId });
  },

  /** 节点 5：反馈解析 + 影响分析 */
  async runFeedback(
    feedback: string,
    performance: PerformanceDraft,
    plan: PlanSnapshot,
    viewerUserId?: string,
    confirmedTitles: string[] = [],
  ): Promise<AgentResult<ImpactReport>> {
    return analyzeFeedback({ feedback, performance, plan, viewerUserId, confirmedTitles });
  },

  async runRevision(feedback: string, performance: PerformanceDraft, plan: PlanSnapshot, impacts: ImpactItem[], viewerUserId?: string): Promise<AgentResult<RevisionSnapshot>> {
    return composeRevision({ feedback, performance, plan, impacts, viewerUserId });
  },

  /** 节点 4：一致性检查（确定性规则 + AI 语义） */
  async runValidate(plan: PlanSnapshot, viewerUserId?: string): Promise<AgentResult<ValidationIssue[]>> {
    return validatePlan({ plan, viewerUserId });
  },
};
