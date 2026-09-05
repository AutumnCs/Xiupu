import "server-only";
import { parseRequirement } from "./requirement-parser";
import { generateDirections } from "./creative-director";
import { composePlan } from "./plan-composer";
import { analyzeFeedback } from "./feedback-analyst";
import { validatePlan } from "./consistency-checker";
import type {
  AgentResult,
  StructuredRequirement,
  CreativeDirection,
  PlanSnapshot,
  ChangeProposal,
  ValidationIssue,
} from "./types";

/**
 * 编排器（Orchestrator）
 * ----------------------------------------------------------------------------
 * StageMuse 是「编排器 + 专职 Agent」架构，每个阶段是独立可替换的节点。
 * 关键铁律：AI 只负责生成/检查/联动；每个节点产出先进草稿态，由秀导确认后才进入下一步。
 *
 * 已接入真实模型的节点：
 *   1) requirement  —— 需求解析 Agent
 *   2) directions   —— 创意生成 Agent
 *   3) plan         —— 多专业方案生成 Agent（节目拆解 + 逐段专业内容）
 *   4) validate     —— 一致性检查 Agent（确定性规则优先 + AI 语义）
 *   5) feedback     —— 反馈解析 + 影响分析 Agent（含字段级修改指令）
 *
 *   6) apply        —— 联动更新目前在前端按 edits 应用（先预览后应用）
 * ----------------------------------------------------------------------------
 */

export const orchestrator = {
  /** 节点 1：需求解析 */
  async runRequirement(brief: string, viewerUserId?: string): Promise<AgentResult<StructuredRequirement>> {
    return parseRequirement({ brief, viewerUserId });
  },

  /** 节点 2：创意生成 */
  async runDirections(requirement: StructuredRequirement, viewerUserId?: string): Promise<AgentResult<CreativeDirection[]>> {
    return generateDirections({ requirement, viewerUserId });
  },

  /** 节点 3：拆解选定方向为多专业方案表 */
  async runPlan(
    direction: CreativeDirection,
    requirement?: StructuredRequirement | null,
    viewerUserId?: string,
  ): Promise<AgentResult<PlanSnapshot>> {
    return composePlan({ direction, requirement, viewerUserId });
  },

  /** 节点 5：反馈解析 + 影响分析 */
  async runFeedback(
    feedback: string,
    plan: PlanSnapshot,
    viewerUserId?: string,
  ): Promise<AgentResult<ChangeProposal[]>> {
    return analyzeFeedback({ feedback, plan, viewerUserId });
  },

  /** 节点 4：一致性检查（确定性规则 + AI 语义） */
  async runValidate(plan: PlanSnapshot, viewerUserId?: string): Promise<AgentResult<ValidationIssue[]>> {
    return validatePlan({ plan, viewerUserId });
  },
};
