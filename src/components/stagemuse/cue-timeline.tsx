"use client";

import { useTranslation } from "react-i18next";
import { parseCueTimeRange } from "@/lib/project-state/timeline";
import type { EditableCueField } from "@/lib/project-state/plan-edit";
import type { PlanSnapshot } from "@/lib/agents/types";

type CueTimelineProps = {
  plan: PlanSnapshot;
  selected: number | null;
  onSelect: (index: number) => void;
  onEdit: (index: number, field: EditableCueField, value: string) => void;
};

/** 单一 Cue 序列：时间、内容和可编辑焦点共用同一选择状态。 */
export function CueTimeline({ plan, selected, onSelect, onEdit }: CueTimelineProps) {
  const { t } = useTranslation();
  const activeIndex = selected ?? 0;
  const activeRow = plan.rows[activeIndex];
  const ranges = plan.rows.map((row) => parseCueTimeRange(row.time));
  const starts = ranges.flatMap((range) => range ? [range.startSeconds] : []);
  const ends = ranges.flatMap((range) => range ? [range.startSeconds + range.durationSeconds] : []);
  const start = starts.length ? Math.min(...starts) : 0;
  const end = ends.length ? Math.max(...ends) : start;

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
            const width = range ? Math.max(142, Math.round((range.durationSeconds / Math.max(end - start, 1)) * 460)) : 142;
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
                <strong className="mt-1 block text-xs" style={{ color: "var(--sm-blue)" }}>{row.time}</strong>
                <span className="mt-2 block truncate text-[11px] font-semibold">{row.music || t("stagemuse.timeline.noMusic")}</span>
              </button>
            );
          })}
        </div>
        {activeRow && (
          <div className="mt-2 grid gap-2 rounded-xl border-2 border-[var(--sm-line)] bg-[#fffbee] p-3 md:grid-cols-2">
            <label className="text-[11px] font-bold">
              {t("stagemuse.timeline.timeLabel")}
              <input key={`time-${activeIndex}`} className="mt-1 w-full rounded border-2 border-[var(--sm-line)] bg-[var(--sm-paper)] px-2 py-1.5 font-mono text-xs" defaultValue={activeRow.time} onBlur={(event) => onEdit(activeIndex, "time", event.target.value)} />
            </label>
            <CueField label={t("stagemuse.timeline.music")} value={activeRow.music} field="music" index={activeIndex} onEdit={onEdit} />
            <CueField label={t("stagemuse.timeline.formation")} value={activeRow.formationNote} field="formation" index={activeIndex} onEdit={onEdit} />
            <CueField label={t("stagemuse.timeline.visual")} value={activeRow.visual} field="visual" index={activeIndex} onEdit={onEdit} />
            <CueField label={t("stagemuse.timeline.lighting")} value={activeRow.lighting} field="lighting" index={activeIndex} onEdit={onEdit} />
          </div>
        )}
      </div>
    </section>
  );
}

function CueField({ label, value, field, index, onEdit }: { label: string; value: string; field: EditableCueField; index: number; onEdit: CueTimelineProps["onEdit"] }) {
  return (
    <label className="text-[11px] font-bold">
      {label}
      <textarea key={`${field}-${index}`} className="mt-1 min-h-16 w-full resize-y rounded border-2 border-[var(--sm-line)] bg-[var(--sm-paper)] px-2 py-1.5 text-xs font-normal leading-5" defaultValue={value} onBlur={(event) => onEdit(index, field, event.target.value)} />
    </label>
  );
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}
