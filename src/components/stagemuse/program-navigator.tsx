"use client";

import { Layers3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCueIndexesForProgram } from "@/lib/project-state/program-workspace";
import type { PlanSnapshot, Program } from "@/lib/agents/types";

export function ProgramNavigator({ programs, plan, selectedProgramId, onSelect }: { programs: Program[]; plan: PlanSnapshot; selectedProgramId: string | null; onSelect: (id: string | null) => void }) {
  const { t } = useTranslation();
  if (!programs.length) return null;
  return <section className="sm-panel execution-only" data-el="program-navigator">
    <div className="sm-phead"><div className="flex items-center gap-2"><Layers3 size={16} /><h2>{t("stagemuse.program.navigatorTitle")}</h2></div><span className="sm-lab">{programs.length} PROGRAMS</span></div>
    <div className="flex gap-2 overflow-x-auto p-3">
      <button type="button" className={`shrink-0 rounded-xl border-2 px-3 py-2 text-left ${selectedProgramId === null ? "border-[var(--sm-red)] bg-[var(--sm-cream)]" : "border-[var(--sm-line)] bg-[#fffbee]"}`} onClick={() => onSelect(null)}><b className="block text-xs">{t("stagemuse.program.all")}</b><span className="sm-lab">{plan.rows.length} CUES</span></button>
      {programs.map((program) => {
        const count = getCueIndexesForProgram(plan.rows, program).length;
        return <button key={program.id} type="button" className={`shrink-0 rounded-xl border-2 px-3 py-2 text-left ${selectedProgramId === program.id ? "border-[var(--sm-red)] bg-[var(--sm-cream)]" : "border-[var(--sm-line)] bg-[#fffbee]"}`} onClick={() => onSelect(program.id)}><b className="block text-xs">{program.title || t("stagemuse.program.untitled")}</b><span className="sm-lab">{program.chapter || program.type || t("stagemuse.program.noChapter")} · {count} CUES</span></button>;
      })}
    </div>
  </section>;
}
