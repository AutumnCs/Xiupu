"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { stageMuseApi } from "@/lib/api/stagemuse";
import { FormationSvg } from "./formation-svg";
import { createRequirementItem, toggleRequirementLock, type RequirementItem } from "@/lib/project-state/requirements";
import { isTextMaterial } from "@/lib/project-state/materials";
import type {
  StructuredRequirement,
  CreativeDirection,
  PlanSnapshot,
  PlanRow,
  ChangeProposal,
  FieldEdit,
  ValidationIssue,
} from "@/lib/agents/types";

const CASE_BRIEF =
  "3分钟科技品牌开场秀，主题「从个体到共生」；12名舞者（含1名领舞）；主LED屏，左右两个出入口；情绪从克制到连接再到爆发；结尾需体现品牌力量感。";
const FEEDBACK_EXAMPLE = "人数改成8人；最后30秒更有力量感；不使用手持道具。";
const COLS = ["time", "music", "speech", "formation", "visual", "lighting", "props"] as const;

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

type VersionEntry = { ver: string; summary: string; time: string };

export function Workbench() {
  const { t } = useTranslation();

  const [brief, setBrief] = useState("");
  const [projectMaterials, setProjectMaterials] = useState("");
  const [requirement, setRequirement] = useState<StructuredRequirement | null>(null);
  const [requirementItems, setRequirementItems] = useState<RequirementItem[]>([]);
  const [reqFallback, setReqFallback] = useState(false);
  const [directions, setDirections] = useState<CreativeDirection[] | null>(null);
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [v1, setV1] = useState<PlanSnapshot | null>(null);
  const [v2, setV2] = useState<PlanSnapshot | null>(null);
  const [current, setCurrent] = useState<"v1" | "v2">("v1");
  const [showDiff, setShowDiff] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [proposals, setProposals] = useState<ChangeProposal[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [validating, setValidating] = useState(false);

  const [loading, setLoading] = useState<string | null>(null);

  async function onMaterialFiles(files: FileList | null) {
    const selected = Array.from(files ?? []).filter((file) => isTextMaterial(file.name));
    if (!selected.length) return toast.error(t("stagemuse.req.textFilesOnly"));
    const content = await Promise.all(selected.map(async (file) => `【${file.name}】\n${await file.text()}`));
    setProjectMaterials((current) => [current, ...content].filter(Boolean).join("\n\n"));
  }

  const nowTime = () =>
    new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const addVersion = (ver: string, summary: string) =>
    setVersions((v) => [{ ver, summary, time: nowTime() }, ...v]);

  function handleErr() {
    toast.error(t("stagemuse.toast.failed"));
  }

  // ---- 节点 4：一致性检查（方案生成/更新后自动运行，满足 AC06） ----
  async function runValidate(plan: PlanSnapshot) {
    setValidating(true);
    try {
      const r = await stageMuseApi.validatePlan(plan);
      setIssues(r.data);
    } catch {
      setIssues([]);
    } finally {
      setValidating(false);
    }
  }

  const activePlan = current === "v2" && v2 ? v2 : v1;

  // ---- 节点 1：解析需求 ----
  async function onParse() {
    if (!brief.trim()) return toast.error(t("stagemuse.toast.needInput"));
    setLoading("parse");
    try {
      const r = await stageMuseApi.parseRequirement([brief.trim(), projectMaterials.trim()].filter(Boolean).join("\n\n项目补充资料：\n"));
      setRequirement(r.data);
      setRequirementItems(toRequirementItems(r.data));
      setReqFallback(!!r.fallback);
      toast.success(r.fallback ? t("stagemuse.toast.aiFallback") : t("stagemuse.toast.reqDone"));
    } catch {
      handleErr();
    } finally {
      setLoading(null);
    }
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

  // ---- 节点 3：选方向 → 生成方案表（占位） ----
  async function onSelectDir(id: string) {
    setSelectedDir(id);
    const direction = directions?.find((d) => d.id === id);
    if (!direction) return;
    setLoading("plan");
    try {
      const r = await stageMuseApi.generatePlan(direction, requirement);
      setV1(r.data);
      setV2(null);
      setCurrent("v1");
      setProposals(null);
      addVersion("v1", t("stagemuse.log.v1"));
      toast.success(r.fallback ? t("stagemuse.toast.aiFallback") : t("stagemuse.toast.dirSelected"));
      runValidate(r.data);
    } catch {
      handleErr();
    } finally {
      setLoading(null);
    }
  }

  // ---- 节点 5：反馈影响分析（占位） ----
  async function onAnalyze() {
    if (!v1) return toast.error(t("stagemuse.toast.needPlan"));
    if (!feedback.trim()) return toast.error(t("stagemuse.toast.needFb"));
    setLoading("fb");
    try {
      const r = await stageMuseApi.analyzeFeedback(feedback, v1);
      setProposals(r.data);
      setChecked(Object.fromEntries(r.data.map((p) => [p.id, true])));
      if (r.fallback) toast.message(t("stagemuse.toast.aiFallback"));
    } catch {
      handleErr();
    } finally {
      setLoading(null);
    }
  }

  // ---- 节点 6：确认应用 → 生成 V2（本地联动，符合"先预览后应用"） ----
  function onApply() {
    if (!v1 || !proposals) return;
    const chosen = proposals.filter((p) => checked[p.id]);
    if (!chosen.length) return toast.error(t("stagemuse.toast.noChange"));
    const next = clone(v1);
    chosen.forEach((p) => p.edits.forEach((e) => applyEdit(next, e)));
    setV2(next);
    setCurrent("v2");
    addVersion("v2", `${t("stagemuse.log.v2")}（${chosen.length}）`);
    toast.success(t("stagemuse.toast.v2Ready"));
    runValidate(next);
  }

  function editCell(rowIdx: number, col: string, value: string) {
    const target = current === "v2" ? v2 : v1;
    if (!target) return;
    const next = clone(target);
    (next.rows[rowIdx] as unknown as Record<string, unknown>)[col] = value;
    if (current === "v2") setV2(next);
    else setV1(next);
  }

  const cellChanged = (base: PlanRow, row: PlanRow, col: string): boolean => {
    if (col === "formation")
      return base.people !== row.people || base.formationNote !== row.formationNote || base.lead !== row.lead;
    const key = col as keyof PlanRow;
    return String(base[key] ?? "") !== String(row[key] ?? "");
  };

  const diffOn = showDiff && current === "v2" && !!v2 && !!v1;

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[300px_1fr_320px]">
      {/* ============ LEFT ============ */}
      <div className="grid content-start gap-2.5">
        <section className="sm-panel">
          <div className="sm-phead">
            <h2>{t("stagemuse.req.title")}</h2>
            <span className="sm-lab">INPUT / BASELINE</span>
          </div>
          {!requirement ? (
            <div className="p-3">
              <textarea
                className="sm-ta"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={t("stagemuse.req.placeholder")}
              />
              <label className="sm-ghost mt-2 inline-flex cursor-pointer items-center">
                {t("stagemuse.req.importText")}
                <input className="sr-only" type="file" accept=".txt,.md,text/plain,text/markdown" multiple onChange={(event) => void onMaterialFiles(event.target.files)} />
              </label>
              <textarea
                className="sm-ta mt-2"
                value={projectMaterials}
                onChange={(e) => setProjectMaterials(e.target.value)}
                placeholder={t("stagemuse.req.materialsPlaceholder")}
              />
              <div className="mt-2.5 flex gap-2">
                <button className="sm-solid" onClick={onParse} disabled={loading === "parse"}>
                  {loading === "parse" ? t("stagemuse.req.parsing") : t("stagemuse.req.parse")}
                </button>
                <button className="sm-ghost" onClick={() => setBrief(CASE_BRIEF)}>
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
              <RequirementGroup tone="pending" label={t("stagemuse.req.pending")} items={requirementItems} onChange={setRequirementItems} />
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
                <button
                  key={d.id}
                  className={`sm-dcard ${selectedDir === d.id ? "active" : ""}`}
                  onClick={() => onSelectDir(d.id)}
                >
                  <h3>{d.title}</h3>
                  <p>{d.concept}</p>
                  <div className="sm-chips">
                    <span className="sm-chip green">{d.format}</span>
                    <span className="sm-chip">{d.arc}</span>
                    <span className="sm-chip red">{t("stagemuse.dir.diff")}：{d.difficulty}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ============ CENTER ============ */}
      <div className="grid content-start gap-2.5">
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
              </div>
            )}
          </div>

          {!activePlan ? (
            <div className="sm-empty" style={{ minHeight: 380 }}>
              {loading === "plan" ? (
                <>
                  <div style={{ paddingTop: 40 }}>
                    <span className="sm-spinner" />
                  </div>
                  <div style={{ marginTop: 16 }}>{t("stagemuse.plan.loading")}</div>
                </>
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
                      <tr key={ri}>
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
                              contentEditable
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
                  issues.map((iss, i) => <IssueItem key={i} issue={iss} />)
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

        {proposals && (
          <section className="sm-panel">
            <div className="sm-phead">
              <h2>{t("stagemuse.prop.title")}</h2>
              <span className="sm-lab">{proposals.length} PROPOSALS</span>
            </div>
            <div className="p-3 pb-1">
              <p className="mb-2 text-[11px]" style={{ color: "var(--sm-muted)" }}>
                {t("stagemuse.prop.hint")}
              </p>
              {proposals.map((p) => (
                <div key={p.id} className="sm-prop">
                  <input
                    type="checkbox"
                    checked={!!checked[p.id]}
                    onChange={(e) => setChecked((c) => ({ ...c, [p.id]: e.target.checked }))}
                  />
                  <div className="min-w-0 flex-1">
                    <h4>{p.title}</h4>
                    <div className="sm-diff">
                      <span className="sm-before">{p.before}</span>{" "}
                      <span className="sm-after">→ {p.after}</span>
                    </div>
                    <p className="reason">{p.reason}</p>
                    <div className="sm-chips">
                      {p.deps.map((d) => (
                        <span key={d} className="sm-chip">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button className="sm-solid w-full" onClick={onApply}>
                {t("stagemuse.prop.apply")}
              </button>
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
              {versions.map((v, i) => (
                <div key={i} className={`sm-vitem ${i === 0 ? "top" : ""}`}>
                  <b>{v.ver.toUpperCase()}</b> · {v.summary}
                  <small>{v.time}</small>
                </div>
              ))}
            </div>
          </section>
        )}
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
          <li key={item.id} className="flex gap-1">
            <input className="min-w-0 flex-1 bg-transparent" value={item.text} onChange={(event) => onChange(items.map((current) => current.id === item.id ? { ...current, text: event.target.value } : current))} />
            <button type="button" className="sm-ghost px-2 py-0 text-[10px]" onClick={() => onChange(items.map((current) => current.id === item.id ? toggleRequirementLock(current) : current))}>{item.locked ? t("stagemuse.req.unlock") : t("stagemuse.req.lock")}</button>
            <button type="button" className="sm-ghost px-2 py-0 text-[10px]" onClick={() => onChange(items.filter((current) => current.id !== item.id))}>{t("stagemuse.req.remove")}</button>
          </li>
        ))}
      </ul>
      <button type="button" className="mx-2 mb-2 text-[11px] underline" onClick={() => onChange([...items, createRequirementItem(tone, "")])}>{t("stagemuse.req.add")}</button>
    </div>
  );
}

function IssueItem({ issue }: { issue: ValidationIssue }) {
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
    <div className="sm-issue">
      <span className={`sm-sev ${sevClass}`}>{sevLabel}</span>
      <div>
        <p>{issue.message}</p>
        <small>
          {where}｜{src}
          {issue.suggestion ? `｜${t("stagemuse.validate.suggest")}：${issue.suggestion}` : ""}
        </small>
      </div>
    </div>
  );
}

// 按 Agent 返回的字段级修改指令应用到方案表（对任意反馈通用）
function applyEdit(plan: PlanSnapshot, edit: FieldEdit) {
  const targets = edit.rowIndex === -1 ? plan.rows : plan.rows[edit.rowIndex] ? [plan.rows[edit.rowIndex]] : [];
  targets.forEach((row) => {
    (row as unknown as Record<string, unknown>)[edit.field] = edit.value;
  });
}
