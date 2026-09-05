import type { ImpactItem, ImpactReport } from "@/lib/agents/types";

/** Returns the one impact the director is deciding on in this round. */
export function getNextImpact(report: ImpactReport, skippedIds: Set<string>): ImpactItem | null {
  return [...report.must, ...report.maybe].find((impact) => !skippedIds.has(impact.id)) ?? null;
}
