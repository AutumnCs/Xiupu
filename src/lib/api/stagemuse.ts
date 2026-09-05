import { request } from "@/lib/api/request";
import type {
  AgentResult,
  StructuredRequirement,
  CreativeDirection,
  PlanSnapshot,
  ChangeProposal,
  ValidationIssue,
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
  generateDirections: (requirement: StructuredRequirement) =>
    post<CreativeDirection[]>("/api/agents/directions", { requirement }),
  generatePlan: (direction: CreativeDirection, requirement: StructuredRequirement | null) =>
    post<PlanSnapshot>("/api/agents/plan", { direction, requirement }),
  analyzeFeedback: (feedback: string, plan: PlanSnapshot) =>
    post<ChangeProposal[]>("/api/agents/feedback", { feedback, plan }),
  validatePlan: (plan: PlanSnapshot) =>
    post<ValidationIssue[]>("/api/agents/validate", { plan }),
};
