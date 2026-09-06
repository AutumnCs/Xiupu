"use client";

import { useTranslation } from "react-i18next";
import { getCueTimelineRanges } from "@/lib/project-state/timeline";
import type { EditableCueField } from "@/lib/project-state/plan-edit";
import type { PlanSnapshot } from "@/lib/agents/types";
import { getCueContext, type CueStatus } from "@/lib/project-state/cue-core";

type CueTimelineProps = {
  plan: PlanSnapshot;
  selected: number | null;
  onSelect: (index: number) => void;
  onEdit: (index: number, field: EditableCueField, value: string) => void;
  editable: boolean;
  onStatusChange: (index: number, status: CueStatus) => void;
};

/** 单一 Cue 序列：时间、内容和可编辑焦点共用同一选择状态。 */
export function CueTimeline({ plan, selected, onSelect, onEdit, editable, onStatusChange }: CueTimelineProps) {
  const { t } = useTranslation();
  const activeIndex = selected ?? 0;
  const activeRow = plan.rows[activeIndex];
  const ranges = getCueTimelineRanges(plan.rows);
  const start = ranges.length ? Math.min(...ranges.map((range) => range.startSeconds)) : 0;
  const end = ranges.length ? Math.max(...ranges.map((range) => range.startSeconds + range.durationSeconds)) : start;
  const context = getCueContext(plan, activeIndex);
  const canEditCue = editable && activeRow?.status !== "locked";

  return (
    <section className="sm-panel">
      <div className="sm-phead">
        <div><h2>{t("stagemuse.timeline.title")}</h2><span className="sm-lab">{plan.segmentLabel}</span></div>
        <span className="sm-lab">{t("stagemuse.timeline.cueCount", { count: plan.rows.length })}</span>
      </div>
      <div className="p-3">
        <p className="mb-2 text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.timeline.hint")}</p>
        <div className="mb-1 flex justify-between px-1 font-mono text-[10px] font-bold" style={{ color: "var(--sm-muted)" }}>
          <span>{formatSeconds(start)}</span><span>{formatSeconds(end)}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" aria-label={t("stagemuse.timeline.title")}>
          {plan.rows.map((row, index) => {
            const range = ranges[index];
            const width = Math.max(142, Math.round((range.durationSeconds / Math.max(end - start, 1)) * 460));
            return (
              <button
                key={`${row.time}-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                aria-pressed={activeIndex === index}
                className={`shrink-0 rounded-xl border-2 p-3 text-left transition ${activeIndex === index ? "border-[var(--sm-red)] bg-[var(--sm-cream)] shadow-[inset_0_-4px_0_var(--sm-red)]" : "border-[var(--sm-line)] bg-[#fffbee] hover:-translate-y-0.5"}`}
                style={{ width }}
              >
                <span className="sm-lab">{t("stagemuse.timeline.cue", { n: index + 1 })}</span>
                <span className={`ml-1 sm-chip ${row.status === "locked" ? "red" : row.status === "confirmed" ? "green" : ""}`}>{t(`stagemuse.cueStatus.${row.status || "draft"}`)}</span>
                <strong className="mt-1 block text-xs" style={{ color: "var(--sm-blue)" }}>{row.time}</strong>
                <span className="mt-2 block truncate text-[11px] font-semibold">{row.music || t("stagemuse.timeline.noMusic")}</span>
              </button>
            );
          })}
        </div>
        {activeRow && (
          <div className="mt-2 rounded-xl border-2 border-[var(--sm-line)] bg-[#fffbee] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--sm-line)] pb-2">
              <div><b className="text-sm">{t("stagemuse.timeline.cue", { n: activeIndex + 1 })}</b><p className="mt-1 text-[10px]" style={{ color: "var(--sm-muted)" }}>{context.previous || t("stagemuse.cue.noPrevious")} → {context.next || t("stagemuse.cue.noNext")}</p></div>
              <label className="text-[11px] font-bold">{t("stagemuse.cue.status")}<select className="ml-2 rounded border-2 border-[var(--sm-line)] bg-[var(--sm-paper)] px-2 py-1 text-xs" value={activeRow.status || "draft"} onChange={(event) => onStatusChange(activeIndex, event.target.value as CueStatus)} disabled={!editable}><option value="draft">{t("stagemuse.cueStatus.draft")}</option><option value="ready">{t("stagemuse.cueStatus.ready")}</option><option value="confirmed">{t("stagemuse.cueStatus.confirmed")}</option><option value="locked">{t("stagemuse.cueStatus.locked")}</option></select></label>
            </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-[11px] font-bold">
              {t("stagemuse.timeline.timeLabel")}
              <input key={`time-${activeIndex}`} disabled={!canEditCue} className="mt-1 w-full rounded border-2 border-[var(--sm-line)] bg-[var(--sm-paper)] px-2 py-1.5 font-mono text-xs" defaultValue={activeRow.time} onBlur={(event) => onEdit(activeIndex, "time", event.target.value)} />
            </label>
            <CueField label={t("stagemuse.timeline.music")} value={activeRow.music} field="music" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.cue.speech")} value={activeRow.speech} field="speech" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.timeline.formation")} value={activeRow.formationNote} field="formation" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.timeline.visual")} value={activeRow.visual} field="visual" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.timeline.lighting")} value={activeRow.lighting} field="lighting" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.cue.props")} value={activeRow.props} field="props" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.cue.camera")} value={activeRow.camera || ""} field="camera" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
            <CueField label={t("stagemuse.cue.notes")} value={activeRow.notes || ""} field="notes" index={activeIndex} onEdit={onEdit} disabled={!canEditCue} />
          </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CueField({ label, value, field, index, onEdit, disabled }: { label: string; value: string; field: EditableCueField; index: number; onEdit: CueTimelineProps["onEdit"]; disabled: boolean }) {
  return (
    <label className="text-[11px] font-bold">
      {label}
      <textarea key={`${field}-${index}`} disabled={disabled} className="mt-1 min-h-16 w-full resize-y rounded border-2 border-[var(--sm-line)] bg-[var(--sm-paper)] px-2 py-1.5 text-xs font-normal leading-5" defaultValue={value} onBlur={(event) => onEdit(index, field, event.target.value)} />
    </label>
  );
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}
