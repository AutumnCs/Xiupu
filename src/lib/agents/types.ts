/**
 * StageMuse 领域类型 —— 编排器与各专职 Agent 共享。
 * 与 PRD 的 ProjectPlan 聚合根对齐，便于后续插入新 Agent。
 */

export type ReqTone = "fixed" | "creative" | "pending";

/** 需求解析 Agent 输出：三分类结构化需求 */
export interface StructuredRequirement {
  fixed: string[];      // 已确定（硬约束，生成不得违反）
  creative: string[];   // 可创作（允许 AI 发挥的部分）
  pending: string[];    // 待确认（缺失/冲突，不静默猜测）
}

/** 创意生成 Agent 输出：单个创意方向 */
export interface CreativeDirection {
  id: string;
  title: string;
  concept: string;
  format: string;       // 演绎形式
  arc: string;          // 情绪曲线
  keyMoments: string;   // 关键舞台时刻
  difficulty: string;   // 难度：低/中/高
}

/** 方案表单行（多专业内容，当前阶段为预置占位） */
export interface PlanRow {
  time: string;
  music: string;
  speech: string;
  people: number;
  lead: boolean;
  formationNote: string;
  visual: string;
  lighting: string;
  props: string;
  camera?: string;
  notes?: string;
}

export interface PlanSnapshot {
  segmentLabel: string;
  columns: string[];
  rows: PlanRow[];
}

/** 单条字段级修改指令：让 V2 生成可对任意反馈通用 */
export interface FieldEdit {
  rowIndex: number;              // 目标行（-1 表示所有行）
  field: string;                 // 目标列，如 "props" / "people" / "lighting"
  value: string | number | boolean;
}

/** 反馈影响分析 Agent 输出：单条修改预览 */
export interface ChangeProposal {
  id: string;
  title: string;
  before: string;
  after: string;
  reason: string;
  deps: string[];
  edits: FieldEdit[];            // 勾选应用后据此修改方案表
}

/** 一致性检查 Agent 输出：单条问题 */
export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  rowIndex: number;              // -1 表示整体/跨行问题
  field?: string;                // 关联字段（可选）
  message: string;               // 问题描述
  suggestion?: string;           // 修改建议
  source: "rule" | "ai";         // 来自确定性规则还是 AI 语义检查
}

/** 统一的 Agent 结果封装：便于排障与后续扩展 */
export interface AgentResult<T> {
  ok: boolean;
  agent: string;
  data: T;
  raw?: string;         // 模型原始输出，排障用
  fallback?: boolean;   // 是否使用了兜底数据
}
