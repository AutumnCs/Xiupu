"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Lock, LockKeyholeOpen, Trash2 } from "lucide-react";
import { stageMuseApi } from "@/lib/api/stagemuse";
import { listProjectVersions, listProjects, loadProjectShare, loadProjectVersion, saveProject, type ProjectListItem, type ProjectSnapshot, type RevisionRecord, type VersionListItem } from "@/lib/api/projects";
import { FormationSvg } from "./formation-svg";
import { CueTimeline } from "./cue-timeline";
import { PerformanceEditor } from "./performance-editor";
import { createRequirementItem, toggleRequirementLock, type RequirementItem } from "@/lib/project-state/requirements";
import { isTextMaterial } from "@/lib/project-state/materials";
import { type EditableCueField, updatePlanRow } from "@/lib/project-state/plan-edit";
import { getNextImpact } from "@/lib/project-state/impact-queue";
import { buildProjectBrief } from "@/lib/project-state/project-brief";
import { mergeClarificationsIntoBrief } from "@/lib/project-state/clarifications";
import { canEditProject, toProjectSource, type ProjectApprovalStatus } from "@/lib/project-state/project-governance";
import { updateCueStatus, type CueStatus } from "@/lib/project-state/cue-core";
import { hasLockedAffectedCue, summarizePlanChanges } from "@/lib/project-state/revision-log";
import type {
  StructuredRequirement,
  CreativeDirection,
  ProjectBrief,
  PerformanceDraft,
  PlanSnapshot,
  PlanRow,
  ImpactItem,
  ImpactReport,
  ValidationIssue,
} from "@/lib/agents/types";

const CASE_BRIEF =
  "3分钟科技品牌开场秀，主题「从个体到共生」；12名舞者（含1名领舞）；主LED屏，左右两个出入口；情绪从克制到连接再到爆发；结尾需体现品牌力量感。";
const FEEDBACK_EXAMPLE = "人数改成8人；最后30秒更有力量感；不使用手持道具。";
const COLS = ["time", "music", "speech", "formation", "visual", "lighting", "props", "camera", "notes"] as const;

type VersionEntry = { ver: string; summary: string; time: string };

export function Workbench() {
  const { t } = useTranslation();

  const [brief, setBrief] = useState("");
  const [projectMaterials, setProjectMaterials] = useState("");
  const [project, setProject] = useState<ProjectBrief>({ projectName: "", directorRequirements: "", programMaterial: "", performers: "", stageConditions: "", creativeIntent: "", supportingMaterials: "" });
  const [requirement, setRequirement] = useState<StructuredRequirement | null>(null);
  const [requirementItems, setRequirementItems] = useState<RequirementItem[]>([]);
  const [reqFallback, setReqFallback] = useState(false);
  const [directions, setDirections] = useState<CreativeDirection[] | null>(null);
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [performanceV1, setPerformanceV1] = useState<PerformanceDraft | null>(null);
  const [performanceV2, setPerformanceV2] = useState<PerformanceDraft | null>(null);
  const [v1, setV1] = useState<PlanSnapshot | null>(null);
  const [v2, setV2] = useState<PlanSnapshot | null>(null);
  const [current, setCurrent] = useState<"v1" | "v2">("v1");
  const [selectedCueIndex, setSelectedCueIndex] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [impactReport, setImpactReport] = useState<ImpactReport | null>(null);
  const [skippedImpactIds, setSkippedImpactIds] = useState<Set<string>>(new Set());
  const [confirmedImpactTitles, setConfirmedImpactTitles] = useState<string[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [validating, setValidating] = useState(false);
  const validationRun = useRef(0);

  const [loading, setLoading] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [shareToken, setShareToken] = useState<string | undefined>();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<ProjectListItem[]>([]);
  const [databaseVersions, setDatabaseVersions] = useState<VersionListItem[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<ProjectApprovalStatus>("draft");
  const [revisionRecords, setRevisionRecords] = useState<RevisionRecord[]>([]);

  function restoreSnapshot(snapshot: ProjectSnapshot, metadata?: { id?: string; shareToken?: string; shareUrl?: string }) {
    if (metadata?.id) setProjectId(metadata.id);
    if (metadata?.shareToken) setShareToken(metadata.shareToken);
    if (metadata?.shareUrl) setShareUrl(metadata.shareUrl);
    setProject(snapshot.project);
    setBrief(snapshot.project.programMaterial);
    setProjectMaterials(snapshot.project.supportingMaterials || "");
    setRequirement(snapshot.requirement);
    setRequirementItems(snapshot.requirement ? toRequirementItems(snapshot.requirement) : []);
    setPerformanceV1(snapshot.performanceV1);
    setPerformanceV2(snapshot.performanceV2);
    setV1(snapshot.v1);
    setV2(snapshot.v2);
    setCurrent(snapshot.current);
    setFeedback(snapshot.feedback);
    setApprovalStatus(snapshot.approvalStatus || "draft");
    setRevisionRecords(snapshot.revisionRecords || []);
    setImpactReport(null);
    setSkippedImpactIds(new Set());
    setConfirmedImpactTitles([]);
  }

  async function refreshProjectLibrary(id = projectId) {
    try {
      const projects = await listProjects();
      setSavedProjects(projects);
      if (id) setDatabaseVersions(await listProjectVersions(id));
    } catch {
      // Persistence is optional for local demos; keep the workbench usable when Supabase is unavailable.
    }
  }

  async function onMaterialFiles(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    const content = await Promise.all(selected.map(async (file) => {
      if (isTextMaterial(file.name)) return `【${file.name}】\n${await file.text()}`;
      if (!/\.(docx|pdf)$/i.test(file.name)) throw new Error("unsupported");
      const body = new FormData(); body.set("file", file);
      const response = await fetch("/api/materials/extract", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("extract_failed");
      return `【${result.name}】\n${result.text}`;
    }));
    const nextMaterials = [project.supportingMaterials, ...content].filter(Boolean).join("\n\n");
    setProjectMaterials(nextMaterials);
    setProject((current) => ({ ...current, supportingMaterials: nextMaterials }));
  }

  const nowTime = () =>
    new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const addVersion = (ver: string, summary: string) =>
    setVersions((v) => [{ ver, summary, time: nowTime() }, ...v]);

  useEffect(() => {
    const share = new URLSearchParams(window.location.search).get("share");
    if (!share) return;
    loadProjectShare(share)
      .then((saved) => {
        restoreSnapshot(saved.snapshot, { id: saved.id, shareToken: share, shareUrl: window.location.href });
        if (saved.snapshot.v1) addVersion("v1", t("stagemuse.log.loaded"));
        if (saved.snapshot.v2) addVersion("v2", t("stagemuse.log.v2"));
        toast.success(t("stagemuse.persistence.loaded"));
      })
      .catch(() => toast.error(t("stagemuse.persistence.loadFailed")));
    // Share links are loaded once when the workbench mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listProjects().then((projects) => setSavedProjects(projects)).catch(() => undefined);
    // The library is optional; failure must not block the local demo.
  }, []);

  function handleErr() {
    toast.error(t("stagemuse.toast.failed"));
  }

  async function onSaveProject() {
    if (!v1) return toast.error(t("stagemuse.toast.needPlan"));
    setLoading("save");
    try {
      const snapshot: ProjectSnapshot = { project, requirement, performanceV1, performanceV2, v1, v2, current, feedback, approvalStatus, revisionRecords };
      const saved = await saveProject(snapshot, projectId, shareToken);
      setProjectId(saved.id);
      setShareToken(saved.shareToken);
      setShareUrl(saved.shareUrl);
      addVersion(`v${saved.version}`, t("stagemuse.persistence.versionSaved"));
      await refreshProjectLibrary(saved.id);
      toast.success(t("stagemuse.persistence.saved"));
    } catch {
      toast.error(t("stagemuse.persistence.unavailable"));
    } finally {
      setLoading(null);
    }
  }

  // ---- 节点 4：一致性检查（方案生成/更新后自动运行，满足 AC06） ----
  async function runValidate(plan: PlanSnapshot) {
    const run = ++validationRun.current;
    setValidating(true);
    try {
      const r = await stageMuseApi.validatePlan(plan);
      if (run === validationRun.current) setIssues(r.data);
    } catch {
      if (run === validationRun.current) setIssues([]);
    } finally {
      if (run === validationRun.current) setValidating(false);
    }
  }

  const activePlan = current === "v2" && v2 ? v2 : v1;
  const activePerformance = current === "v2" && performanceV2 ? performanceV2 : performanceV1;
  const nextImpact = impactReport ? getNextImpact(impactReport, skippedImpactIds) : null;
  const editable = canEditProject(approvalStatus);

  function updateProjectField(field: keyof ProjectBrief, value: string) {
    setProject((current) => ({ ...current, [field]: value }));
  }

  // ---- 节点 1：解析需求 ----
  async function onParse() {
    const rawBrief = toProjectSource({ ...project, programMaterial: project.programMaterial || brief, supportingMaterials: project.supportingMaterials || projectMaterials });
    if (!rawBrief) return toast.error(t("stagemuse.toast.needInput"));
    setLoading("parse");
    try {
      const nextProject = { ...buildProjectBrief(rawBrief, project.supportingMaterials || projectMaterials), ...project, projectName: project.projectName.trim() || "未命名节目", programMaterial: project.programMaterial || brief || rawBrief, supportingMaterials: project.supportingMaterials || projectMaterials };
      setProject(nextProject);
      const r = await stageMuseApi.parseRequirement([
        `项目资料：${rawBrief}`, nextProject.supportingMaterials && `补充资料：${nextProject.supportingMaterials}`,
      ].filter(Boolean).join("\n\n"));
      setRequirement(r.data);
      setRequirementItems(toRequirementItems(r.data));
      setReqFallback(!!r.fallback);
      setConfirmedImpactTitles([]);
      toast.success(r.fallback ? t("stagemuse.toast.aiFallback") : t("stagemuse.toast.reqDone"));
    } catch {
      handleErr();
    } finally {
      setLoading(null);
    }
  }

  async function onReparseClarifications() {
    if (!requirement) return;
    const clarifications = requirementItems.filter((item) => item.tone === "pending").map((item) => item.text);
    const baseBrief = brief || project.programMaterial;
    const nextBrief = mergeClarificationsIntoBrief(baseBrief, clarifications);
    if (nextBrief === baseBrief.trim()) return toast.error(t("stagemuse.toast.needClarification"));
    setBrief(nextBrief);
    setRequirement(null);
    setDirections(null);
    setSelectedDir(null);
    setPerformanceV1(null);
    setPerformanceV2(null);
    setV1(null);
    setV2(null);
    setCurrent("v1");
    setLoading("parse");
    try {
      const nextProject = { ...buildProjectBrief(nextBrief, project.supportingMaterials || projectMaterials), ...project, projectName: project.projectName.trim() || "未命名节目", programMaterial: project.programMaterial || nextBrief, supportingMaterials: project.supportingMaterials || projectMaterials };
      setProject(nextProject);
      const r = await stageMuseApi.parseRequirement(`项目资料：${nextBrief}\n\n补充资料：${nextProject.supportingMaterials || "无"}`);
      setRequirement(r.data);
      setRequirementItems(toRequirementItems(r.data));
      setReqFallback(!!r.fallback);
      toast.success(t("stagemuse.toast.reqDone"));
    } catch { handleErr(); } finally { setLoading(null); }
  }

  // ---- 节点 2：生成创意方向 ----
  async function onGenDir() {
    if (!requirement) return;
    const editedRequirement = toStructuredRequirement(requirementItems);
    setRequirement(editedRequirement);
    setLoading("dir");
    try {
      const r = await stageMuseApi.generateDirections(editedRequirement);
      setDirections(r.data);
      toast.success(r.fallback ? t("stagemuse.toast.aiFallback") : t("stagemuse.toast.dirDone"));
    } catch {
      handleErr();
    } finally {
      setLoading(null);
    }
  }

  // ---- 节点 3：选方向 → 生成完整演绎形式 ----
  function onSelectDir(id: string) {
    setSelectedDir(id);
    setPerformanceV1(null);
    setPerformanceV2(null);
    setV1(null);
    setV2(null);
    setImpactReport(null);
    setCurrent("v1");
  }

  function updateDirection(id: string, field: "title" | "concept" | "format") {
    return (value: string) => setDirections((current) => current?.map((direction) => direction.id === id ? { ...direction, [field]: value } : direction) ?? null);
  }

  async function onGeneratePerformance() {
    const direction = directions?.find((d) => d.id === selectedDir);
    if (!direction || !requirement) return;
    const loadingToast = toast.loading(t("stagemuse.plan.workingToast"), {
      description: t("stagemuse.plan.workingToastDescription"),
    });
    setLoading("performance");
    try {
      const r = await stageMuseApi.generatePerformance(project, requirement, direction);
      setPerformanceV1(r.data);
      setPerformanceV2(null);
      setV1(null);
      setV2(null);
      setCurrent("v1");
      setImpactReport(null);
      setConfirmedImpactTitles([]);
      toast.success(r.fallback ? t("stagemuse.toast.aiFallback") : t("stagemuse.performance.done"), {
        id: loadingToast,
      });
    } catch {
      toast.error(t("stagemuse.toast.failed"), { id: loadingToast });
    } finally {
      setLoading(null);
    }
  }

  async function onGeneratePlan() {
    if (!performanceV1) return;
    setLoading("plan");
    try {
      const r = await stageMuseApi.generatePlan(project, performanceV1);
      setV1(r.data); setV2(null); setCurrent("v1"); setImpactReport(null); setConfirmedImpactTitles([]); addVersion("v1", t("stagemuse.log.v1"));
      toast.success(r.fallback ? t("stagemuse.toast.aiFallback") : t("stagemuse.toast.dirSelected"));
      runValidate(r.data);
    } catch { handleErr(); } finally { setLoading(null); }
  }

  // ---- 节点 5：反馈影响分析 ----
  async function onAnalyze() {
    if (!activePlan || !activePerformance) return toast.error(t("stagemuse.toast.needPlan"));
    if (!feedback.trim()) return toast.error(t("stagemuse.toast.needFb"));
    setLoading("fb");
    try {
      const r = await stageMuseApi.analyzeFeedback(feedback, activePerformance, activePlan);
      setImpactReport(r.data);
      setSkippedImpactIds(new Set());
      setConfirmedImpactTitles([]);
      if (r.fallback) toast.message(t("stagemuse.toast.aiFallback"));
    } catch {
      handleErr();
    } finally {
      setLoading(null);
    }
  }

  // ---- 节点 6：逐项确认 → 生成 V2 → 重新分析剩余影响 ----
  async function onApply(impact: ImpactItem) {
    if (!activePlan || !activePerformance) return;
    const locked = hasLockedAffectedCue(activePlan, impact.cueIds);
    if (locked.length) return toast.error(t("stagemuse.toast.lockedImpact", { cues: locked.join("、") }));
    setLoading("revision");
    try {
      const r = await stageMuseApi.generateRevision(feedback, activePerformance, activePlan, [impact]);
      const nextConfirmedTitles = [...confirmedImpactTitles, impact.title];
      setRevisionRecords((records) => [{ id: impact.id, source: t("stagemuse.revision.source"), reason: feedback, cueIds: impact.cueIds, departments: impact.departments, status: "confirmed", createdAt: new Date().toISOString() }, ...records]);
      setPerformanceV2(r.data.performance); setV2(r.data.plan); setCurrent("v2"); addVersion("v2", `${t("stagemuse.log.v2")}（1）`); runValidate(r.data.plan);
      const reassessed = await stageMuseApi.analyzeFeedback(feedback, r.data.performance, r.data.plan, nextConfirmedTitles);
      setConfirmedImpactTitles(nextConfirmedTitles);
      setImpactReport(reassessed.data);
      setSkippedImpactIds(new Set());
      toast.success(t("stagemuse.toast.v2Ready"));
    } catch { handleErr(); } finally { setLoading(null); }
  }

  function editCell(rowIdx: number, col: EditableCueField, value: string) {
    if (!editable) return;
    const target = current === "v2" ? v2 : v1;
    if (!target || target.rows[rowIdx]?.status === "locked") return;
    const next = updatePlanRow(target, rowIdx, col, value);
    if (current === "v2") setV2(next);
    else setV1(next);
    runValidate(next);
  }

  function setCueStatus(rowIdx: number, status: CueStatus) {
    const target = current === "v2" ? v2 : v1;
    if (!target || !editable) return;
    const next = updateCueStatus(target, rowIdx, status);
    if (current === "v2") setV2(next); else setV1(next);
  }

  function lockRevisionRecord(record: RevisionRecord) {
    setRevisionRecords((records) => records.map((item) => item.id === record.id ? { ...item, status: "locked" } : item));
    const target = current === "v2" ? v2 : v1;
    if (!target) return;
    const lockedPlan = { ...target, rows: target.rows.map((row) => row.id && record.cueIds.includes(row.id) ? { ...row, status: "locked" as const } : row) };
    if (current === "v2") setV2(lockedPlan); else setV1(lockedPlan);
  }

  const cellChanged = (base: PlanRow, row: PlanRow, col: string): boolean => {
    if (col === "formation")
      return base.people !== row.people || base.formationNote !== row.formationNote || base.lead !== row.lead;
    const key = col as keyof PlanRow;
    return String(base[key] ?? "") !== String(row[key] ?? "");
  };

  const diffOn = showDiff && current === "v2" && !!v2 && !!v1;
  const versionChanges = v1 && v2 ? summarizePlanChanges(v1, v2) : [];

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[300px_1fr_320px]">
      {/* ============ LEFT ============ */}
      <div className="grid content-start gap-2.5">
        {savedProjects.length > 0 && (
          <section className="sm-panel">
            <div className="sm-phead"><h2>{t("stagemuse.persistence.projects")}</h2><span className="sm-lab">LIBRARY</span></div>
            <div className="p-3 space-y-2">
              {savedProjects.map((saved) => (
                <button key={saved.id} type="button" className="w-full rounded-xl border px-3 py-2 text-left" style={{ borderColor: "var(--sm-border)", background: saved.id === projectId ? "var(--sm-yellow)" : "var(--sm-paper)" }} onClick={async () => {
                  try {
                    const loaded = await loadProjectShare(saved.share_token);
                    restoreSnapshot(loaded.snapshot, { id: loaded.id, shareToken: saved.share_token, shareUrl: `${window.location.origin}/?share=${saved.share_token}` });
                    setDatabaseVersions(await listProjectVersions(saved.id));
                    addVersion("saved", t("stagemuse.persistence.loaded"));
                    toast.success(t("stagemuse.persistence.loaded"));
                  } catch { toast.error(t("stagemuse.persistence.loadFailed")); }
                }}>
                  <span className="block text-sm font-bold">{saved.title || t("stagemuse.persistence.untitled")}</span>
                  <span className="text-[10px]" style={{ color: "var(--sm-muted)" }}>{new Date(saved.updated_at).toLocaleString("zh-CN")}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="sm-panel">
          <div className="sm-phead">
            <h2>{t("stagemuse.req.title")}</h2>
            <span className="sm-lab">INPUT / BASELINE</span>
          </div>
          {!requirement ? (
            <div className="p-3">
              <textarea className="sm-ta min-h-40" value={brief} disabled={!editable} onChange={(event) => setBrief(event.target.value)} placeholder={t("stagemuse.req.placeholder")} />
              <p className="mt-3 text-[11px] font-black" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.project.box")}</p>
              <div className="mt-2 grid gap-2">
                <input className="sm-ta min-h-0" value={project.projectName} disabled={!editable} onChange={(event) => updateProjectField("projectName", event.target.value)} placeholder={t("stagemuse.project.name")} />
                <textarea className="sm-ta" value={project.directorRequirements} disabled={!editable} onChange={(event) => updateProjectField("directorRequirements", event.target.value)} placeholder={t("stagemuse.project.director")} />
                <textarea className="sm-ta" value={project.programMaterial} disabled={!editable} onChange={(event) => updateProjectField("programMaterial", event.target.value)} placeholder={t("stagemuse.project.program")} />
                <textarea className="sm-ta" value={project.performers} disabled={!editable} onChange={(event) => updateProjectField("performers", event.target.value)} placeholder={t("stagemuse.project.performers")} />
                <textarea className="sm-ta" value={project.stageConditions} disabled={!editable} onChange={(event) => updateProjectField("stageConditions", event.target.value)} placeholder={t("stagemuse.project.stage")} />
                <textarea className="sm-ta" value={project.creativeIntent} disabled={!editable} onChange={(event) => updateProjectField("creativeIntent", event.target.value)} placeholder={t("stagemuse.project.creative")} />
              </div>
              <label className="sm-ghost mt-2 inline-flex cursor-pointer items-center">
                {t("stagemuse.req.importText")}
                <input className="sr-only" type="file" accept=".txt,.md,.docx,.pdf,text/plain,text/markdown,application/pdf" multiple onChange={(event) => void onMaterialFiles(event.target.files)} />
              </label>
              <textarea
                className="sm-ta mt-2"
                value={project.supportingMaterials}
                disabled={!editable}
                onChange={(e) => { setProjectMaterials(e.target.value); setProject((value) => ({ ...value, supportingMaterials: e.target.value })); }}
                placeholder={t("stagemuse.req.materialsPlaceholder")}
              />
              <div className="mt-2.5 flex gap-2">
                <button className="sm-solid" onClick={onParse} disabled={loading === "parse" || !editable}>
                  {loading === "parse" ? t("stagemuse.req.parsing") : t("stagemuse.req.parse")}
                </button>
                <button className="sm-ghost" disabled={!editable} onClick={() => { setBrief(CASE_BRIEF); setProject((value) => ({ ...value, projectName: "科技品牌开场秀", directorRequirements: CASE_BRIEF, programMaterial: "3分钟开场节目", performers: "12名舞者（含1名领舞）", stageConditions: "主LED屏，左右两个出入口", creativeIntent: "克制到连接再到爆发" })); }}>
                  {t("stagemuse.req.loadCase")}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 pb-1">
              {reqFallback && (
                <div className="mb-2">
                  <span className="sm-chip red">{t("stagemuse.ai.fallback")}</span>
                </div>
              )}
              <RequirementGroup tone="fixed" label={t("stagemuse.req.fixed")} items={requirementItems} onChange={setRequirementItems} />
              <RequirementGroup tone="creative" label={t("stagemuse.req.creative")} items={requirementItems} onChange={setRequirementItems} />
              <p className="mb-2 text-[11px] font-semibold" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.req.pendingHint")}</p>
              <RequirementGroup tone="pending" label={t("stagemuse.req.pending")} items={requirementItems} onChange={setRequirementItems} />
              {requirementItems.some((item) => item.tone === "pending" && item.text.trim()) && <button className="sm-ghost mb-2 w-full" onClick={() => void onReparseClarifications()} disabled={loading === "parse"}>
                {loading === "parse" ? t("stagemuse.req.parsing") : t("stagemuse.req.reparse")}
              </button>}
              <button className="sm-solid w-full" onClick={onGenDir} disabled={loading === "dir"}>
                {loading === "dir" ? t("stagemuse.req.generating") : t("stagemuse.req.genDir")}
              </button>
            </div>
          )}
        </section>

        {directions && (
          <section className="sm-panel">
            <div className="sm-phead">
              <h2>{t("stagemuse.dir.title")}</h2>
              <span className="sm-lab">3 OPTIONS</span>
            </div>
            <div className="p-3 pb-1">
              {directions.map((d) => (
                <div
                  key={d.id}
                  className={`sm-dcard ${selectedDir === d.id ? "active" : ""}`}
                >
                  {selectedDir === d.id ? (
                    <>
                      <h3>{d.title}</h3>
                      <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--sm-green)" }} aria-live="polite">{t("stagemuse.dir.selectedHint")}</p>
                      <input className="mt-2 w-full bg-transparent font-bold" value={d.format} onChange={(event) => updateDirection(d.id, "format")(event.target.value)} />
                      <textarea className="sm-ta mt-2" value={d.concept} onChange={(event) => updateDirection(d.id, "concept")(event.target.value)} />
                      <div className="sm-chips">
                        <span className="sm-chip green">{d.format}</span>
                        <span className="sm-chip">{d.arc}</span>
                        <span className="sm-chip red">{t("stagemuse.dir.diff")}：{d.difficulty}</span>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="block w-full text-left" onClick={() => onSelectDir(d.id)} aria-pressed="false">
                      <h3>{d.title}</h3>
                      <p>{d.concept}</p>
                      <div className="sm-chips">
                        <span className="sm-chip green">{d.format}</span>
                        <span className="sm-chip">{d.arc}</span>
                        <span className="sm-chip red">{t("stagemuse.dir.diff")}：{d.difficulty}</span>
                      </div>
                    </button>
                  )}
                </div>
              ))}
              {selectedDir && <button className="sm-solid w-full" onClick={onGeneratePerformance} disabled={loading === "performance"}>{loading === "performance" ? t("stagemuse.performance.loading") : t("stagemuse.performance.generate")}</button>}
            </div>
          </section>
        )}
      </div>

      {/* ============ CENTER ============ */}
      <div className="grid content-start gap-2.5">
        {activePerformance && <PerformanceEditor performance={activePerformance} readOnly={current === "v2" || !editable} onChange={(next) => { if (current === "v2") setPerformanceV2(next); else { setPerformanceV1(next); setV1(null); setImpactReport(null); } }} />}
        {performanceV1 && !v1 && <button className="sm-solid w-full" onClick={onGeneratePlan} disabled={loading === "plan"}>{loading === "plan" ? t("stagemuse.plan.loading") : t("stagemuse.performance.generateCue")}</button>}
        {activePlan && <CueTimeline plan={activePlan} selected={selectedCueIndex} onSelect={setSelectedCueIndex} onEdit={editCell} editable={editable} onStatusChange={setCueStatus} />}
        <section className="sm-panel">
          <div className="sm-phead">
            <div>
              <h2>{t("stagemuse.plan.title")}</h2>
              {activePlan && <span className="sm-lab">{activePlan.segmentLabel}</span>}
            </div>
            {v1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button className={`sm-pill ${current === "v1" ? "active" : ""}`} onClick={() => setCurrent("v1")}>
                  {t("stagemuse.version.v1")}
                </button>
                <button className={`sm-pill ${current === "v2" ? "active" : ""}`} disabled={!v2} onClick={() => setCurrent("v2")}>
                  {t("stagemuse.version.v2")}
                </button>
                <label className="flex items-center gap-1 text-[11px]" style={{ color: "var(--sm-muted)" }}>
                  <input type="checkbox" checked={showDiff} onChange={(e) => setShowDiff(e.target.checked)} />
                  {t("stagemuse.version.highlight")}
                </label>
                <span className={`sm-chip ${approvalStatus === "locked" ? "red" : approvalStatus === "confirmed" ? "green" : ""}`}>{t(`stagemuse.approval.${approvalStatus}`)}</span>
                <button className="sm-ghost px-2 py-1 text-[10px]" onClick={() => setApprovalStatus(approvalStatus === "locked" ? "confirmed" : "locked")}>{t(approvalStatus === "locked" ? "stagemuse.approval.unlock" : "stagemuse.approval.lock")}</button>
                {approvalStatus === "draft" && <button className="sm-ghost px-2 py-1 text-[10px]" onClick={() => setApprovalStatus("confirmed")}>{t("stagemuse.approval.confirm")}</button>}
              </div>
            )}
          </div>

          {!activePlan ? (
            <div className="sm-empty" style={{ minHeight: 380 }}>
              {loading === "plan" ? (
                <div className="mx-auto flex max-w-sm flex-col items-center px-6 text-center" role="status" aria-live="polite">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--sm-yellow)" }}>
                    <span className="sm-spinner" />
                  </div>
                  <strong className="text-sm">{t("stagemuse.plan.workingTitle")}</strong>
                  <p className="mt-2 text-xs leading-5" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.plan.workingDescription")}</p>
                  <div className="mt-4 grid w-full grid-cols-3 gap-1.5 text-left text-[10px] font-semibold" style={{ color: "var(--sm-muted)" }}>
                    <span className="rounded px-2 py-2" style={{ background: "var(--sm-paper)" }}>{t("stagemuse.plan.workingOutputTime")}</span>
                    <span className="rounded px-2 py-2" style={{ background: "var(--sm-paper)" }}>{t("stagemuse.plan.workingOutputCue")}</span>
                    <span className="rounded px-2 py-2" style={{ background: "var(--sm-paper)" }}>{t("stagemuse.plan.workingOutputDepartments")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="big">🎬</div>
                  {t("stagemuse.plan.empty")}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="sm-twrap">
                <table className="sm-table">
                  <thead>
                    <tr>
                      {COLS.map((c) => (
                        <th key={c}>{t(`stagemuse.col.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activePlan.rows.map((row, ri) => (
                      <tr key={ri} className={selectedCueIndex === ri ? "bg-yellow-100" : ""} onClick={() => setSelectedCueIndex(ri)}>
                        {COLS.map((c) => {
                          const changed = diffOn && v1 ? cellChanged(v1.rows[ri], row, c) : false;
                          if (c === "time")
                            return (
                              <td key={c} className={`time ${changed ? "chg" : ""}`}>
                                {row.time}
                              </td>
                            );
                          if (c === "formation")
                            return (
                              <td key={c} className={changed ? "chg" : ""}>
                                <FormationSvg row={row} />
                              </td>
                            );
                          return (
                            <td
                              key={c}
                              className={changed ? "chg" : ""}
                              contentEditable={editable && row.status !== "locked"}
                              suppressContentEditableWarning
                              onBlur={(e) => editCell(ri, c, e.currentTarget.textContent ?? "")}
                            >
                              {String(row[c as keyof PlanRow] ?? "")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3">
                <div className="sm-phead" style={{ margin: "-13px -13px 8px", borderTop: 0, borderLeft: 0, borderRight: 0, borderRadius: 0, boxShadow: "none" }}>
                  <h2>{t("stagemuse.validate.title")}</h2>
                  <span className="sm-lab">
                    {validating ? t("stagemuse.validate.checking") : `${issues.length} ISSUES`}
                  </span>
                </div>
                {!validating && issues.length === 0 ? (
                  <p className="text-[12px]" style={{ color: "var(--sm-green)", fontWeight: 700 }}>
                    {t("stagemuse.validate.clean")}
                  </p>
                ) : (
                  issues.map((iss, i) => <IssueItem key={i} issue={iss} onSelectCue={setSelectedCueIndex} />)
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ============ RIGHT ============ */}
      <div className="grid content-start gap-2.5">
        <section className="sm-panel">
          <div className="sm-phead">
            <h2>{t("stagemuse.fb.title")}</h2>
            <span className="sm-lab">HUMAN GATE</span>
          </div>
          <div className="p-3">
            <textarea
              className="sm-ta"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t("stagemuse.fb.placeholder")}
            />
            <div className="mt-2.5 flex gap-2">
              <button className="sm-solid flex-1" onClick={onAnalyze} disabled={loading === "fb"}>
                {loading === "fb" ? t("stagemuse.fb.analyzing") : t("stagemuse.fb.analyze")}
              </button>
              <button className="sm-ghost" onClick={() => setFeedback(FEEDBACK_EXAMPLE)}>
                {t("stagemuse.fb.example")}
              </button>
            </div>
          </div>
        </section>

        {impactReport && (
          <section className="sm-panel">
            <div className="sm-phead">
              <h2>{t("stagemuse.prop.title")}</h2>
              <span className="sm-lab">IMPACT REPORT</span>
            </div>
            <div className="p-3 pb-1">
              <p className="mb-2 text-[11px]" style={{ color: "var(--sm-muted)" }}>
                {t("stagemuse.prop.hint")}
              </p>
              {nextImpact ? <ImpactDecision impact={nextImpact} loading={loading === "revision"} onConfirm={() => void onApply(nextImpact)} onSkip={() => setSkippedImpactIds((current) => new Set([...current, nextImpact.id]))} /> : <p className="mb-3 text-xs font-bold" style={{ color: "var(--sm-green)" }}>{t("stagemuse.impact.complete")}</p>}
              <ImpactGroup title={t("stagemuse.impact.unaffected")} items={impactReport.unaffected} />
            </div>
          </section>
        )}

        {versions.length > 0 && (
          <section className="sm-panel">
            <div className="sm-phead">
              <h2>{t("stagemuse.status.title")}</h2>
              <span className="sm-lab">SNAPSHOT</span>
            </div>
            <div className="p-3 pb-1">
              <div className="mb-3 flex gap-2">
                <button className="sm-solid flex-1" onClick={() => void onSaveProject()} disabled={loading === "save"}>{loading === "save" ? t("stagemuse.persistence.saving") : t("stagemuse.persistence.save")}</button>
                {shareUrl && <button className="sm-ghost" onClick={() => void navigator.clipboard?.writeText(shareUrl)}>{t("stagemuse.persistence.copy")}</button>}
              </div>
              {shareUrl && <p className="mb-2 break-all text-[10px]" style={{ color: "var(--sm-muted)" }}>{shareUrl}</p>}
              {versions.map((v, i) => (
                <div key={i} className={`sm-vitem ${i === 0 ? "top" : ""}`}>
                  <b>{v.ver.toUpperCase()}</b> · {v.summary}
                  <small>{v.time}</small>
                </div>
              ))}
              {databaseVersions.length > 0 && <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--sm-border)" }}>
                <p className="mb-2 text-[11px] font-bold" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.persistence.databaseVersions")}</p>
                <div className="space-y-1.5">
                  {databaseVersions.map((v) => <button key={v.id} type="button" className="flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs" style={{ borderColor: "var(--sm-border)" }} onClick={async () => {
                    if (!projectId) return;
                    try { const loaded = await loadProjectVersion(projectId, v.version); restoreSnapshot(loaded.snapshot); addVersion(`v${v.version}`, t("stagemuse.persistence.loaded")); toast.success(t("stagemuse.persistence.loaded")); } catch { toast.error(t("stagemuse.persistence.loadFailed")); }
                  }}><span><b>V{v.version}</b> · {v.summary}</span><small style={{ color: "var(--sm-muted)" }}>{new Date(v.created_at).toLocaleString("zh-CN")}</small></button>)}
                </div>
              </div>}
              {versionChanges.length > 0 && <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--sm-border)" }}><p className="mb-2 text-[11px] font-bold" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.revision.diff")}</p>{versionChanges.map((change) => <button key={change.cue} className="mb-1 block w-full rounded border px-2 py-1.5 text-left text-xs" onClick={() => setSelectedCueIndex(change.cue - 1)}>{t("stagemuse.department.cue", { n: change.cue })} · {change.fields.join("、")}</button>)}</div>}
              {revisionRecords.length > 0 && <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--sm-border)" }}><p className="mb-2 text-[11px] font-bold" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.revision.records")}</p>{revisionRecords.map((record) => <div key={record.id} className="sm-vitem"><b>{record.source}</b> · {record.reason}<small>{record.cueIds.join("、") || t("stagemuse.revision.noCue")}｜{record.departments.join("、") || t("stagemuse.revision.noDepartment")}</small><div className="mt-2 flex gap-1"><span className="sm-chip">{t(`stagemuse.revisionStatus.${record.status}`)}</span>{record.status !== "locked" && <button className="sm-ghost px-2 py-0.5 text-[10px]" onClick={() => lockRevisionRecord(record)}>{t("stagemuse.approval.lock")}</button>}</div></div>)}</div>}
            </div>
          </section>
        )}

        {activePlan && <DepartmentRequirements plan={activePlan} selectedCueIndex={selectedCueIndex} onSelectCue={setSelectedCueIndex} />}
      </div>
    </div>
  );
}

function toRequirementItems(requirement: StructuredRequirement): RequirementItem[] {
  return (Object.entries(requirement) as Array<[RequirementItem["tone"], string[]]>).flatMap(([tone, items]) =>
    items.map((text) => createRequirementItem(tone, text)),
  );
}

function toStructuredRequirement(items: RequirementItem[]): StructuredRequirement {
  return {
    fixed: items.filter((item) => item.tone === "fixed").map((item) => item.text),
    creative: items.filter((item) => item.tone === "creative").map((item) => item.text),
    pending: items.filter((item) => item.tone === "pending").map((item) => item.text),
  };
}

function RequirementGroup({ tone, label, items, onChange }: { tone: RequirementItem["tone"]; label: string; items: RequirementItem[]; onChange: (items: RequirementItem[]) => void }) {
  const { t } = useTranslation();
  const toneClass = tone === "fixed" ? "fx" : tone === "creative" ? "cr" : "pd";
  const groupItems = items.filter((item) => item.tone === tone);
  return (
    <div className="sm-rg">
      <div className="sm-rg-t">
        <span className={`sm-dot ${toneClass}`} />
        {label}
      </div>
      <ul>
        {groupItems.map((item) => (
          <li key={item.id} className="sm-rg-item">
            <textarea rows={2} className="sm-rg-input" value={item.text} onChange={(event) => onChange(items.map((current) => current.id === item.id ? { ...current, text: event.target.value } : current))} />
            <span className="sm-rg-actions">
              <button type="button" className="sm-rg-action" aria-label={item.locked ? t("stagemuse.req.unlock") : t("stagemuse.req.lock")} title={item.locked ? t("stagemuse.req.unlock") : t("stagemuse.req.lock")} onClick={() => onChange(items.map((current) => current.id === item.id ? toggleRequirementLock(current) : current))}>{item.locked ? <LockKeyholeOpen size={15} /> : <Lock size={15} />}</button>
              <button type="button" className="sm-rg-action danger" aria-label={t("stagemuse.req.remove")} title={t("stagemuse.req.remove")} onClick={() => onChange(items.filter((current) => current.id !== item.id))}><Trash2 size={15} /></button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="mx-2 mb-2 text-[11px] underline" onClick={() => onChange([...items, createRequirementItem(tone, "")])}>{t("stagemuse.req.add")}</button>
    </div>
  );
}

function IssueItem({ issue, onSelectCue }: { issue: ValidationIssue; onSelectCue: (index: number) => void }) {
  const { t } = useTranslation();
  const sevClass = issue.severity === "error" ? "err" : issue.severity === "warning" ? "warn" : "info";
  const sevLabel =
    issue.severity === "error"
      ? t("stagemuse.validate.sevError")
      : issue.severity === "warning"
        ? t("stagemuse.validate.sevWarning")
        : t("stagemuse.validate.sevInfo");
  const where = issue.rowIndex === -1 ? t("stagemuse.validate.overall") : t("stagemuse.validate.row", { n: issue.rowIndex + 1 });
  const src = issue.source === "rule" ? t("stagemuse.validate.rule") : t("stagemuse.validate.ai");
  return (
    <button type="button" className="sm-issue w-full text-left" onClick={() => issue.rowIndex >= 0 && onSelectCue(issue.rowIndex)}>
      <span className={`sm-sev ${sevClass}`}>{sevLabel}</span>
      <div>
        <p>{issue.message}</p>
        <small>
          {where}｜{src}
          {issue.suggestion ? `｜${t("stagemuse.validate.suggest")}：${issue.suggestion}` : ""}
        </small>
      </div>
    </button>
  );
}

const DEPARTMENT_FIELDS = ["music", "visual", "lighting", "performer", "props"] as const;

function DepartmentRequirements({ plan, selectedCueIndex, onSelectCue }: { plan: PlanSnapshot; selectedCueIndex: number | null; onSelectCue: (index: number) => void }) {
  const { t } = useTranslation();
  const [department, setDepartment] = useState<(typeof DEPARTMENT_FIELDS)[number]>("music");
  const fieldFor = (row: PlanRow, key: (typeof DEPARTMENT_FIELDS)[number]) => key === "performer" ? row.formationNote : row[key];
  const requirements = plan.rows.map((row, cueIndex) => ({ cueIndex, time: row.time, content: fieldFor(row, department) })).filter((item) => item.content && item.content !== "无");
  return (
    <section className="sm-panel">
      <div className="sm-phead"><h2>{t("stagemuse.department.title")}</h2><span className="sm-lab">{t("stagemuse.department.autoExtract")}</span></div>
      <div className="p-3">
        <div className="flex flex-wrap gap-1.5" aria-label={t("stagemuse.department.switchLabel")}>
          {DEPARTMENT_FIELDS.map((key) => (
            <button key={key} type="button" onClick={() => setDepartment(key)} className={`sm-chip ${department === key ? "red" : ""}`}>
              {t(`stagemuse.department.${key}`)} · {plan.rows.filter((row) => fieldFor(row, key) && fieldFor(row, key) !== "无").length}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px]" style={{ color: "var(--sm-muted)" }}>{t("stagemuse.department.hint")}</p>
        <div className="mt-2 space-y-2">
          {requirements.map((item) => (
            <button key={item.cueIndex} type="button" onClick={() => onSelectCue(item.cueIndex)} className={`block w-full rounded-xl border-2 p-3 text-left ${selectedCueIndex === item.cueIndex ? "border-[var(--sm-red)] bg-[var(--sm-cream)]" : "border-[var(--sm-line)] bg-[#fffbee]"}`}>
              <div className="flex items-center justify-between gap-2"><b className="text-xs">{t("stagemuse.department.cue", { n: item.cueIndex + 1 })}</b><span className="sm-lab">{item.time}</span></div>
              <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--sm-muted)" }}>{item.content}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactDecision({ impact, loading, onConfirm, onSkip }: { impact: ImpactItem; loading: boolean; onConfirm: () => void; onSkip: () => void }) {
  const { t } = useTranslation();
  const label = impact.level === "must" ? t("stagemuse.impact.must") : t("stagemuse.impact.maybe");
  return <div className="mb-3"><b className="text-xs">{label}</b><div className="sm-prop"><div><h4>{impact.title}</h4><p className="reason">{impact.detail}</p><div className="sm-chips">{impact.departments.map((department) => <span key={department} className="sm-chip">{department}</span>)}</div><div className="mt-3 flex gap-2"><button className="sm-solid flex-1" onClick={onConfirm} disabled={loading}>{loading ? t("stagemuse.impact.revising") : t("stagemuse.impact.confirmOne")}</button><button className="sm-ghost" onClick={onSkip} disabled={loading}>{t("stagemuse.impact.skip")}</button></div></div></div></div>;
}

function ImpactGroup({ title, items }: { title: string; items: ImpactItem[] }) {
  if (!items.length) return null;
  return <div className="mb-3"><b className="text-xs">{title}</b>{items.map((item) => <div key={item.id} className="sm-prop"><div><h4>{item.title}</h4><p className="reason">{item.detail}</p></div></div>)}</div>;
}
