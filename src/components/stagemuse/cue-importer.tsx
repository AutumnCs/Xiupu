"use client";

import { useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { parseCueTable } from "@/lib/project-state/cue-import";
import type { PlanSnapshot, Program } from "@/lib/agents/types";

export function CueImporter({ programs, editable, onImport }: { programs: Program[]; editable: boolean; onImport: (plan: PlanSnapshot) => void }) {
  const { t } = useTranslation();
  const [source, setSource] = useState("");
  const runImport = () => {
    try { const plan = parseCueTable(source, programs); onImport(plan); setSource(""); toast.success(t("stagemuse.cueImport.done", { count: plan.rows.length })); }
    catch { toast.error(t("stagemuse.cueImport.failed")); }
  };
  return <details className="sm-panel execution-only" data-el="cue-import"><summary className="sm-phead cursor-pointer"><span className="inline-flex items-center gap-2"><ClipboardPaste size={16} /><b>{t("stagemuse.cueImport.title")}</b></span><span className="sm-lab">PASTE TABLE</span></summary><div className="p-3"><p className="mb-2 text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.cueImport.hint")}</p><textarea className="sm-ta min-h-28" disabled={!editable} value={source} onChange={(event) => setSource(event.target.value)} placeholder={t("stagemuse.cueImport.placeholder")} /><button type="button" className="sm-solid mt-2" disabled={!editable || !source.trim()} onClick={runImport}>{t("stagemuse.cueImport.import")}</button></div></details>;
}
