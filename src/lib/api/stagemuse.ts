import { request } from "@/lib/api/request";
import type {
  AgentResult,
  StructuredRequirement,
  CreativeDirection,
  ProjectBrief,
  PerformanceDraft,
  PlanSnapshot,
  ImpactItem,
  ImpactReport,
  RevisionSnapshot,
  ValidationIssue,
  VisualReferenceAnalysis,
} from "@/lib/agents/types";

/** 未登录（401）专用错误，供 UI 引导登录 */
export class AuthRequiredError extends Error {
  constructor() {
    super("auth_required");
    this.name = "AuthRequiredError";
  }
}

async function post<T>(url: string, body: unknown): Promise<AgentResult<T>> {
  const res = await request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new AuthRequiredError();
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "agent_failed");
  return json.result as AgentResult<T>;
}

export const stageMuseApi = {
  parseRequirement: (brief: string) =>
    post<StructuredRequirement>("/api/agents/requirement", { brief }),
  generateDirections: (requirement: StructuredRequirement, project?: ProjectBrief) =>
    post<CreativeDirection[]>("/api/agents/directions", { requirement, project }),
  generatePerformance: (project: ProjectBrief, requirement: StructuredRequirement, direction: CreativeDirection) =>
    post<PerformanceDraft>("/api/agents/performance", { project, requirement, direction }),
  generatePlan: (project: ProjectBrief, performance: PerformanceDraft) =>
    post<PlanSnapshot>("/api/agents/plan", { project, performance }),
  analyzeFeedback: (feedback: string, performance: PerformanceDraft, plan: PlanSnapshot, confirmedTitles: string[] = []) =>
    post<ImpactReport>("/api/agents/feedback", { feedback, performance, plan, confirmedTitles }),
  generateRevision: (feedback: string, performance: PerformanceDraft, plan: PlanSnapshot, impacts: ImpactItem[]) =>
    post<RevisionSnapshot>("/api/agents/revision", { feedback, performance, plan, impacts }),
  validatePlan: (plan: PlanSnapshot) =>
    post<ValidationIssue[]>("/api/agents/validate", { plan }),
  analyzeVisualReference: async (file: File, input: { project: ProjectBrief; direction?: CreativeDirection; logoNotes: string; mustKeep: string }): Promise<AgentResult<VisualReferenceAnalysis>> => {
    const body = new FormData();
    body.set("image", file); body.set("project", JSON.stringify(input.project)); body.set("logoNotes", input.logoNotes); body.set("mustKeep", input.mustKeep);
    if (input.direction) body.set("direction", JSON.stringify(input.direction));
    const res = await request("/api/agents/visual-reference", { method: "POST", body });
    if (res.status === 401) throw new AuthRequiredError();
    if (!res.ok) throw new Error(`请求失败 (${res.status})`);
    const json = await res.json();
    if (!json?.ok) throw new Error(json?.error || "visual_agent_failed");
    return json.result as AgentResult<VisualReferenceAnalysis>;
  },
};
