"use client";

import { useTranslation } from "react-i18next";
import type { PerformanceDraft, PerformanceSection } from "@/lib/agents/types";

export function PerformanceEditor({ performance, readOnly, onChange }: { performance: PerformanceDraft; readOnly: boolean; onChange: (next: PerformanceDraft) => void }) {
  const { t } = useTranslation();
  const update = (field: "title" | "theme" | "overview", value: string) => onChange({ ...performance, [field]: value });
  const updateSection = (index: number, field: keyof PerformanceSection, value: string) => onChange({ ...performance, sections: performance.sections.map((section, current) => current === index ? { ...section, [field]: value } : section) });
  return (
    <section className="sm-panel">
      <div className="sm-phead"><h2>{t("stagemuse.performance.title")}</h2><span className="sm-lab">{readOnly ? "V2" : "DRAFT"}</span></div>
      <div className="p-3">
        {readOnly ? <><h3 className="text-base font-black">{performance.title}</h3><p className="mt-1 text-sm">{performance.theme}</p><p className="mt-2 text-xs" style={{ color: "var(--sm-muted)" }}>{performance.overview}</p></> : <><input className="w-full bg-transparent text-base font-black" value={performance.title} onChange={(event) => update("title", event.target.value)} /><textarea className="sm-ta mt-2" value={performance.theme} onChange={(event) => update("theme", event.target.value)} /><textarea className="sm-ta mt-2" value={performance.overview} onChange={(event) => update("overview", event.target.value)} /></>}
        <div className="mt-3 space-y-2">
          {performance.sections.map((section, index) => (
            <div key={section.id} className="rounded-xl border-2 border-[var(--sm-line)] bg-[#fffbee] p-3">
              {readOnly ? <><div className="flex justify-between gap-2"><b>{section.label}</b><span className="sm-lab">{section.durationLabel}</span></div><p className="mt-1 text-xs">{section.staging}</p><p className="mt-1 text-[11px]" style={{ color: "var(--sm-muted)" }}>{section.blocking}｜{section.visual}｜{section.lighting}</p></> : <><input className="w-full bg-transparent text-sm font-black" value={section.label} onChange={(event) => updateSection(index, "label", event.target.value)} /><input className="mt-1 w-full bg-transparent text-xs font-bold" value={section.durationLabel} onChange={(event) => updateSection(index, "durationLabel", event.target.value)} /><textarea className="sm-ta mt-2 min-h-16" value={section.staging} onChange={(event) => updateSection(index, "staging", event.target.value)} /><textarea className="sm-ta mt-2 min-h-14" value={section.blocking} onChange={(event) => updateSection(index, "blocking", event.target.value)} /><textarea className="sm-ta mt-2 min-h-14" value={section.visual} onChange={(event) => updateSection(index, "visual", event.target.value)} /><textarea className="sm-ta mt-2 min-h-14" value={section.lighting} onChange={(event) => updateSection(index, "lighting", event.target.value)} /></>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
