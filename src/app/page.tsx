"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Check, ChevronRight, FilePlus2, FolderClosed, Home as HomeIcon, PackageOpen, Plus, Search, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserBadge } from "@/components/user-profile/user-badge";
import { Atmosphere } from "@/components/stagemuse/atmosphere";
import { CursorParticles } from "@/components/stagemuse/cursor-particles";
import { Workbench } from "@/components/stagemuse/workbench";

const navigation = [
  { label: "Home", icon: HomeIcon }, { label: "Projects", icon: FolderClosed }, { label: "Assets", icon: PackageOpen },
  { label: "AI Director", icon: ShieldCheck }, { label: "Templates", icon: FilePlus2 },
];
const subjects = [
  { label: "Story", translation: "叙事", className: "story", prompt: "我想从故事开始，构思一场演出。" },
  { label: "Music", translation: "音乐", className: "music", prompt: "我想从音乐出发，编排一场演出。" },
  { label: "Visual", translation: "视觉", className: "visual", prompt: "我想为演出构思舞台视觉。" },
  { label: "Movement", translation: "调度", className: "movement", prompt: "我想梳理演员与舞台的调度。" },
];

export default function Home() {
  const { t } = useTranslation();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [active, setActive] = useState("Home");
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState("");
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [attachment, setAttachment] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const move = (event: PointerEvent) => { document.documentElement.style.setProperty("--title-pointer-x", `${(event.clientX / innerWidth - 0.5) * 2}`); document.documentElement.style.setProperty("--title-pointer-y", `${(event.clientY / innerHeight - 0.5) * 2}`); };
    addEventListener("pointermove", move, { passive: true });
    return () => { if (timer.current) clearTimeout(timer.current); removeEventListener("pointermove", move); };
  }, []);

  const openWorkspace = (value?: string) => { if (value) setPrompt(value); setWorkspaceOpen(true); };
  const feedback = (message: string) => { setNotice(message); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { setNotice(""); setSent(false); }, 2400); };
  const focusPrompt = (value?: string) => { if (value) setPrompt(value); setSent(false); inputRef.current?.focus(); };
  const pulseOrb = () => window.dispatchEvent(new Event("xiupu:orb-pulse"));
  const chooseNavigation = (label: string) => { setActive(label); if (label === "Home") { setSelected(""); setPrompt(""); } else if (label === "Assets") { fileRef.current?.click(); } else if (label === "AI Director") { focusPrompt(); pulseOrb(); } else if (label === "Templates") { focusPrompt("我想从一个演出概念开始。"); } else { openWorkspace(); } };

  if (workspaceOpen) return <div className="studio-app min-h-svh"><header className="studio-header"><button className="studio-wordmark" onClick={() => setWorkspaceOpen(false)}>{t("stagemuse.brand.name")}</button><span className="studio-caption">TURN IDEAS INTO STAGES</span><div className="studio-tools"><LanguageSwitcher /><UserBadge /></div></header><main className="studio-workspace"><div className="studio-workspace-bar"><button className="studio-back" onClick={() => setWorkspaceOpen(false)}><HomeIcon size={15} /> 创作首页</button><span>STAGE PRODUCTION WORKSPACE</span></div><Workbench /></main></div>;

  return <main className="xiupu-home">
    <Atmosphere /><CursorParticles />
    <header className="masthead"><button className="wordmark" onClick={() => chooseNavigation("Home")} aria-label="秀谱首页">{t("stagemuse.brand.name")}</button><span className="brand-caption">TURN IDEAS INTO STAGES</span><div className="header-tools"><label className="search-box"><Search aria-hidden="true" /><input placeholder="Search projects, assets, or anything..." aria-label="搜索项目与素材" /></label><button className="notification-button" aria-label="通知" onClick={() => feedback("暂无新通知")}><Bell /><i /></button><UserBadge /></div></header>
    <aside className="navigation-rail"><nav aria-label="主导航">{navigation.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} aria-label={label} aria-current={active === label ? "page" : undefined} onClick={() => chooseNavigation(label)}><Icon aria-hidden="true" /><span>{label}</span></button>)}</nav><div className="rail-footer"><span className="small-rule" /><p>For a<br />More Creative<br />Stage Tomorrow.</p></div></aside>
    <section className="intro-copy" aria-labelledby="hero-title"><p className="intro-eyebrow">AI FOR<br />STAGE CREATORS</p><h1 id="hero-title" className="artistic-title"><span>Turn</span><span>Ideas</span><span>into Stages.</span></h1><p className="chinese-caption">让每一个想法，走向舞台。</p><span className="small-rule" /></section>
    <div className="orb-interaction"><button className="orb-hit-area" aria-label="唤醒秀谱魔法球，开始创作" onClick={() => { pulseOrb(); focusPrompt(); }} /></div>
    <div className="orb-annotations" aria-label="创作方向"><svg className="annotation-lines" viewBox="0 0 1536 1024" preserveAspectRatio="none" aria-hidden="true"><g><path d="M 630 220 H 662 L 706 264" /><path d="M 1034 265 H 1003 L 974 295" /><path d="M 637 552 H 668 L 697 522" /><path d="M 1084 559 H 1055 L 1020 523" /></g><g className="annotation-dots"><circle cx="630" cy="220" r="4.5" /><circle cx="1034" cy="265" r="4.5" /><circle cx="637" cy="552" r="4.5" /><circle cx="1084" cy="559" r="4.5" /></g></svg>{subjects.map(subject => <button key={subject.label} className={`subject-label ${subject.className}${selected === subject.label ? " selected" : ""}`} onClick={() => { setSelected(subject.label); focusPrompt(subject.prompt); pulseOrb(); }}><span>{subject.label}</span><small>{subject.translation}</small></button>)}</div>
    <button className="project-card" onClick={() => openWorkspace("继续创作《汉语桥 · 开场秀》")} aria-label="选择汉语桥开场秀项目"><span className="project-thumbnail" aria-hidden="true"><img src="/images/xiupu-reference.png" alt="" /></span><span className="project-copy"><strong>汉语桥 · 开场秀</strong><small>Edited 2h ago</small></span><span className="project-arrow"><ChevronRight aria-hidden="true" /></span></button>
    <div className="right-caption"><p>SAME STAGE.<br />A WIDER IMAGINATION.</p><span className="small-rule" /></div><div className="creative-index" aria-hidden="true"><span>PEOPLE</span><span>STAGE</span><span>TECHNOLOGY</span><span>STORY</span><span>MORE …</span></div>
    <section className="creation-dock" aria-label="开始创作"><form className={`prompt-bar${sent ? " submitted" : ""}`} onSubmit={event => { event.preventDefault(); if (!prompt.trim() && !attachment) { inputRef.current?.focus(); return; } setSent(true); pulseOrb(); openWorkspace(prompt); }}><Sparkles className="prompt-spark" aria-hidden="true" /><input ref={inputRef} value={prompt} onChange={event => { setPrompt(event.target.value); setSent(false); }} placeholder={attachment ? `已选择：${attachment}` : "What are we creating today?"} aria-label="描述你的演出创作想法" /><button type="button" className="attach-button" aria-label="添加创作素材" onClick={() => fileRef.current?.click()}><Plus aria-hidden="true" /></button><button type="submit" className="send-button" aria-label="提交创作想法">{sent ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}</button></form><div className="quick-actions"><button onClick={() => openWorkspace("我的演出需求是：")}><FolderClosed aria-hidden="true" />Create from Brief</button><button onClick={() => openWorkspace("我想梳理这场演出的节目结构：")}><Sparkles aria-hidden="true" />Generate Show Structure</button><button onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" />Upload Assets</button><button onClick={() => { setPrompt(""); setAttachment(""); setSelected(""); focusPrompt(); }}><FilePlus2 aria-hidden="true" />Start from Scratch</button></div><p className={`inline-feedback${notice ? " visible" : ""}`} role="status" aria-live="polite">{notice || "\u00a0"}</p></section>
    <input className="file-picker" ref={fileRef} type="file" accept="image/*,audio/*,video/*,.pdf,.docx,.txt" onChange={event => { const file = event.target.files?.[0]; if (file) { setAttachment(file.name); feedback("已选择本地素材"); focusPrompt(); } event.target.value = ""; }} />
  </main>;
}
