"use client";

import { BrainCircuit, Database, Network } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AGENT_REGISTRY } from "@/lib/agents/agent-registry";
import { buildProjectKnowledge } from "@/lib/project-state/project-intelligence";
import type { AgentRunTrace, CreatorProfile, PlanSnapshot, ProjectBrief, StructuredRequirement } from "@/lib/agents/types";

export function ProjectIntelligencePanel({ project, requirement, plan, runs, editable, onProfileChange }: {
  project: ProjectBrief;
  requirement: StructuredRequirement | null;
  plan: PlanSnapshot | null;
  runs: AgentRunTrace[];
  editable: boolean;
  onProfileChange: (profile: CreatorProfile) => void;
}) {
  const { t } = useTranslation();
  const profile = project.creatorProfile || { aestheticPreferences: "", collaborationPreferences: "", outputDetail: "balanced" as const };
  const knowledge = buildProjectKnowledge(project, requirement, plan);
  const formatRun = (run: AgentRunTrace) => `${Math.max(1, Math.round(run.durationMs / 1000))}s`;
  return <section className="sm-panel creative-only" data-el="project-intelligence">
    <div className="sm-phead"><div><h2>{t("stagemuse.intelligence.title")}</h2><span className="sm-lab">CONTEXT / AGENTS</span></div><BrainCircuit size={18} /></div>
    <div className="p-3 space-y-3">
      <details open>
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold"><Database size={14} />{t("stagemuse.intelligence.knowledge")}</summary>
        <div className="mt-2 space-y-1.5">
          {knowledge.length ? knowledge.map((entry) => <div key={entry.id} className="rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--sm-border)", background: "var(--sm-paper)" }}><b className="text-[11px]">{entry.title}</b><p className="mt-0.5 text-[10px] leading-4" style={{ color: "var(--sm-muted)" }}>{entry.summary}</p></div>) : <p className="text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.intelligence.emptyKnowledge")}</p>}
        </div>
      </details>
      <details>
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold"><BrainCircuit size={14} />{t("stagemuse.intelligence.profile")}</summary>
        <div className="mt-2 grid gap-2">
          <textarea className="sm-ta min-h-16" disabled={!editable} value={profile.aestheticPreferences} onChange={(event) => onProfileChange({ ...profile, aestheticPreferences: event.target.value })} placeholder={t("stagemuse.intelligence.aestheticPlaceholder")} />
          <textarea className="sm-ta min-h-16" disabled={!editable} value={profile.collaborationPreferences} onChange={(event) => onProfileChange({ ...profile, collaborationPreferences: event.target.value })} placeholder={t("stagemuse.intelligence.collaborationPlaceholder")} />
          <select className="sm-ta min-h-9" disabled={!editable} value={profile.outputDetail} onChange={(event) => onProfileChange({ ...profile, outputDetail: event.target.value as CreatorProfile["outputDetail"] })} aria-label={t("stagemuse.intelligence.detailLabel")}>
            <option value="concise">{t("stagemuse.intelligence.concise")}</option><option value="balanced">{t("stagemuse.intelligence.balanced")}</option><option value="detailed">{t("stagemuse.intelligence.detailed")}</option>
          </select>
          <p className="text-[10px] leading-4" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.intelligence.profileHint")}</p>
        </div>
      </details>
      <details>
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold"><Network size={14} />{t("stagemuse.intelligence.agents")}</summary>
        <div className="mt-2 space-y-1.5">{AGENT_REGISTRY.map((agent) => <div key={agent.id} className="rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--sm-border)" }}><div className="flex justify-between gap-2"><b className="text-[11px]">{agent.title}</b><span className="sm-lab">{agent.stage.toUpperCase()}</span></div><p className="mt-0.5 text-[10px] leading-4" style={{ color: "var(--sm-muted)" }}>{agent.role}</p></div>)}</div>
      </details>
      <details>
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold"><Network size={14} />{t("stagemuse.intelligence.runs")}</summary>
        <div className="mt-2 space-y-1.5">{runs.length ? runs.slice(0, 6).map((run) => <div key={run.id} className="flex items-start justify-between gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--sm-border)" }}><div><b className="text-[11px]">{AGENT_REGISTRY.find((agent) => agent.id === run.agentId)?.title || run.agentId}</b><p className="text-[10px] leading-4" style={{ color: "var(--sm-muted)" }}>{run.inputSources.join(" · ")}</p></div><span className={`sm-chip ${run.status === "failed" ? "red" : run.fallback ? "green" : ""}`}>{formatRun(run)}</span></div>) : <p className="text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.intelligence.emptyRuns")}</p>}</div>
      </details>
    </div>
  </section>;
}
