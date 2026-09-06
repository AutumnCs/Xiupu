"use client";

import { useState } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { stageMuseApi } from "@/lib/api/stagemuse";
import type { CreativeDirection, ProjectBrief, VisualReferenceAnalysis } from "@/lib/agents/types";

export function VisualReferencePanel({ project, direction, editable }: { project: ProjectBrief; direction?: CreativeDirection; editable: boolean }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [logoNotes, setLogoNotes] = useState("");
  const [mustKeep, setMustKeep] = useState("");
  const [result, setResult] = useState<VisualReferenceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const chooseFile = (next: File | undefined) => {
    if (!next) return;
    if (!next.type.startsWith("image/")) return toast.error(t("stagemuse.visual.invalidImage"));
    if (next.size > 8 * 1024 * 1024) return toast.error(t("stagemuse.visual.tooLarge"));
    setFile(next); setPreview(URL.createObjectURL(next)); setResult(null);
  };
  const analyze = async () => {
    if (!file) return toast.error(t("stagemuse.visual.chooseImage"));
    setLoading(true);
    try { const response = await stageMuseApi.analyzeVisualReference(file, { project, direction, logoNotes, mustKeep }); setResult(response.data); toast.success(t("stagemuse.visual.done")); } catch { toast.error(t("stagemuse.visual.failed")); } finally { setLoading(false); }
  };
  return <section className="sm-panel sm-visual-panel">
    <div className="sm-phead"><div><h2>{t("stagemuse.visual.title")}</h2><span className="sm-lab">REFERENCE → DIRECTION</span></div><ImagePlus size={18} /></div>
    <div className="p-3">
      <label className="sm-visual-upload">{preview ? <img src={preview} alt={t("stagemuse.visual.preview")} /> : <span><ImagePlus size={26} /><b>{t("stagemuse.visual.chooseImage")}</b><small>{t("stagemuse.visual.imageHint")}</small></span>}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={!editable || loading} onChange={(event) => chooseFile(event.target.files?.[0])} /></label>
      <div className="mt-2 grid gap-2 md:grid-cols-2"><label className="text-[11px] font-bold">{t("stagemuse.visual.logoLabel")}<textarea className="sm-ta mt-1 min-h-20" value={logoNotes} onChange={(event) => setLogoNotes(event.target.value)} placeholder={t("stagemuse.visual.logoPlaceholder")} /></label><label className="text-[11px] font-bold">{t("stagemuse.visual.keepLabel")}<textarea className="sm-ta mt-1 min-h-20" value={mustKeep} onChange={(event) => setMustKeep(event.target.value)} placeholder={t("stagemuse.visual.keepPlaceholder")} /></label></div>
      <p className="mt-2 text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.visual.hint")}</p>
      <button type="button" className="sm-solid mt-2 inline-flex items-center gap-2" disabled={!editable || loading || !file} onClick={() => void analyze()}><Sparkles size={15} />{loading ? t("stagemuse.visual.analyzing") : t("stagemuse.visual.analyze")}</button>
      {result && <div className="sm-visual-result mt-3"><div className="sm-visual-summary"><b>{result.summary}</b><div className="sm-chips">{result.styleTags.map((tag) => <span className="sm-chip green" key={tag}>{tag}</span>)}</div></div><div className="sm-visual-grid"><div><strong>{t("stagemuse.visual.palette")}</strong><p>{result.palette.join("、") || "—"}</p></div><div><strong>{t("stagemuse.visual.elements")}</strong><p>{result.stageElements.join("；") || "—"}</p></div><div><strong>{t("stagemuse.visual.lighting")}</strong><p>{result.lighting.join("；") || "—"}</p></div><div><strong>{t("stagemuse.visual.constraints")}</strong><p>{[...result.preservedElements, ...result.constraints].join("；") || "—"}</p></div></div><label className="mt-2 block text-[11px] font-bold">{t("stagemuse.visual.prompt")}<textarea className="sm-ta mt-1 min-h-28" value={result.prompt} onChange={(event) => setResult({ ...result, prompt: event.target.value })} /></label>{result.uncertainties.length > 0 && <p className="mt-2 text-[11px]" style={{ color: "var(--sm-red)" }}>{t("stagemuse.visual.uncertainty")}：{result.uncertainties.join("；")}</p>}</div>}
    </div>
  </section>;
}
