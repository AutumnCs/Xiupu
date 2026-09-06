"use client";

import { useState } from "react";
import { ArrowRight, FolderClosed, Home as HomeIcon, Music2, Sparkles, Upload, WandSparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserBadge } from "@/components/user-profile/user-badge";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Workbench } from "@/components/stagemuse/workbench";

const entryPoints = [{ label: "Story", sub: "叙事", icon: Sparkles }, { label: "Music", sub: "音乐", icon: Music2 }, { label: "Visual", sub: "视觉", icon: WandSparkles }, { label: "Movement", sub: "调度", icon: ArrowRight }];

export default function Home() {
  const { t } = useTranslation();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  return <div className="studio-app min-h-svh">
    <header className="studio-header"><button className="studio-wordmark" onClick={() => setWorkspaceOpen(false)}>{t("stagemuse.brand.name")}</button><span className="studio-caption">TURN IDEAS INTO STAGES</span><div className="studio-tools"><LanguageSwitcher /><UserBadge /></div></header>
    {workspaceOpen ? <main className="studio-workspace"><div className="studio-workspace-bar"><button className="studio-back" onClick={() => setWorkspaceOpen(false)}><HomeIcon size={15} /> 创作首页</button><span>STAGE PRODUCTION WORKSPACE</span></div><Workbench /></main> : <main className="studio-home">
      <aside className="studio-rail"><button className="active"><HomeIcon size={18} /><span>Home</span></button><button onClick={() => setWorkspaceOpen(true)}><FolderClosed size={18} /><span>Projects</span></button><div className="studio-rail-copy">FOR A MORE<br />CREATIVE STAGE<br />TOMORROW.</div></aside>
      <section className="studio-intro"><p>AI FOR<br />STAGE CREATORS</p><h1>Turn<br />Ideas<br /><em>into Stages.</em></h1><span>让每一个想法，走向舞台。</span></section>
      <section className="studio-orb-area"><div className="studio-orb" /><p>秀谱 AI DIRECTOR</p>{entryPoints.map(({ label, sub, icon: Icon }) => <button key={label} className={`studio-entry studio-entry-${label.toLowerCase()}`} onClick={() => setWorkspaceOpen(true)}><Icon size={16} /><strong>{label}</strong><small>{sub}</small></button>)}</section>
      <button className="studio-project-card" onClick={() => setWorkspaceOpen(true)}><span className="studio-project-swatch" /><span><b>开始一个舞台项目</b><small>从需求、资料或一个想法开始</small></span><ArrowRight size={18} /></button>
      <section className="studio-dock"><button className="studio-dock-main" onClick={() => setWorkspaceOpen(true)}><Sparkles size={18} /> What are we creating today? <ArrowRight size={18} /></button><div><button onClick={() => setWorkspaceOpen(true)}><FolderClosed size={14} /> Create from Brief</button><button onClick={() => setWorkspaceOpen(true)}><Upload size={14} /> Upload Assets</button><button onClick={() => setWorkspaceOpen(true)}><WandSparkles size={14} /> Generate Structure</button></div></section>
    </main>}
  </div>;
}
