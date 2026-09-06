"use client";

import { Plus, WandSparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { inferProgramsFromMaterial } from "@/lib/project-state/programs";
import type { Program } from "@/lib/agents/types";

const EMPTY_PROGRAM = (): Program => ({ id: crypto.randomUUID(), title: "", type: "", chapter: "", notes: "" });

export function ProgramListEditor({ material, programs, editable, onChange }: { material: string; programs: Program[]; editable: boolean; onChange: (programs: Program[]) => void }) {
  const { t } = useTranslation();
  const update = (index: number, field: keyof Program, value: string) => onChange(programs.map((program, current) => current === index ? { ...program, [field]: value } : program));
  const recognize = () => { const next = inferProgramsFromMaterial(material); if (next.length) onChange(next); };
  return <section className="sm-panel creative-only" data-el="program-list">
    <div className="sm-phead"><div><h2>{t("stagemuse.program.title")}</h2><span className="sm-lab">PROGRAMS</span></div><span className="sm-lab">{programs.length}</span></div>
    <div className="p-3">
      <p className="mb-2 text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.program.hint")}</p>
      <div className="mb-2 flex gap-2"><button type="button" className="sm-ghost inline-flex items-center gap-1 px-2 py-1 text-[10px]" disabled={!editable || !material.trim()} onClick={recognize}><WandSparkles size={13} />{t("stagemuse.program.recognize")}</button><button type="button" className="sm-ghost inline-flex items-center gap-1 px-2 py-1 text-[10px]" disabled={!editable} onClick={() => onChange([...programs, EMPTY_PROGRAM()])}><Plus size={13} />{t("stagemuse.program.add")}</button></div>
      <div className="space-y-2">{programs.map((program, index) => <div key={program.id} className="rounded-xl border p-2" style={{ borderColor: "var(--sm-border)", background: "var(--sm-paper)" }}><div className="grid gap-1.5 sm:grid-cols-3"><input className="sm-ta min-h-9" disabled={!editable} value={program.title} onChange={(event) => update(index, "title", event.target.value)} placeholder={t("stagemuse.program.name")} /><input className="sm-ta min-h-9" disabled={!editable} value={program.type} onChange={(event) => update(index, "type", event.target.value)} placeholder={t("stagemuse.program.type")} /><input className="sm-ta min-h-9" disabled={!editable} value={program.chapter} onChange={(event) => update(index, "chapter", event.target.value)} placeholder={t("stagemuse.program.chapter")} /></div><textarea className="sm-ta mt-1.5 min-h-14" disabled={!editable} value={program.notes} onChange={(event) => update(index, "notes", event.target.value)} placeholder={t("stagemuse.program.notes")} /></div>)}</div>
    </div>
  </section>;
}
