import "server-only";

import { runAgentJSON } from "./run-agent";
import type { AgentResult, ImpactItem, PerformanceDraft, PlanSnapshot, RevisionSnapshot } from "./types";

const SYSTEM = `你是秀导方案修订助手。根据导演反馈和已经确认的影响项，重建完整单节目演绎形式与完整 Cue 表，只输出 JSON。
只改反馈明确要求及已确认影响项，其他内容保持原逻辑。Cue 覆盖开场到结尾，使用段落节点与粗略时长，不能用精确 timecode。
输出：{"performance":{"title":string,"theme":string,"overview":string,"sections":[{"id":string,"label":string,"durationLabel":string,"staging":string,"blocking":string,"visual":string,"lighting":string}]},"plan":{"segmentLabel":string,"columns":string[],"rows":[]}}。`;

export async function composeRevision(input: { feedback: string; performance: PerformanceDraft; plan: PlanSnapshot; impacts: ImpactItem[]; viewerUserId?: string }): Promise<AgentResult<RevisionSnapshot>> {
  const { data, raw } = await runAgentJSON<RevisionSnapshot>({
    system: SYSTEM,
    user: `当前演绎形式：${JSON.stringify(input.performance)}\n当前 Cue：${JSON.stringify(input.plan.rows)}\n导演反馈：${input.feedback}\n确认影响项：${JSON.stringify(input.impacts)}`,
    viewerUserId: input.viewerUserId,
    params: { max_tokens: 2800, temperature: 0.45 },
  });
  if (!data?.performance?.sections?.length || !data?.plan?.rows?.length) throw new Error("修订结果不完整");
  return { ok: true, agent: "revision-composer", data, raw };
}
