"use client";

import { useTranslation } from "react-i18next";
import { UserBadge } from "@/components/user-profile/user-badge";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Workbench } from "@/components/stagemuse/workbench";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-svh">
      <div className="sm-stage-bg" aria-hidden />
      <div
        className="relative px-3 pt-3"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top,0px))", paddingBottom: "var(--eazo-safe-area-bottom)" }}
      >
        <header className="mx-auto mb-3 grid max-w-[1460px] grid-cols-1 gap-2.5 lg:grid-cols-[auto_1fr_auto]">
          <section className="sm-tile flex items-center gap-3 px-4 py-2.5" style={{ background: "var(--sm-green)", color: "var(--sm-paper2)" }}>
            <div className="sm-mark" aria-hidden />
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-.04em", lineHeight: 1 }}>
                {t("stagemuse.brand.name")}
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.9 }}>
                {t("stagemuse.brand.sub")}
              </div>
            </div>
          </section>
          <div className="hidden lg:block" />
          <section className="sm-tile flex items-center gap-2 px-3 py-2" style={{ background: "var(--sm-yellow)" }}>
            <LanguageSwitcher />
            <UserBadge />
          </section>
        </header>
        <main className="mx-auto max-w-[1460px]">
          <Workbench />
        </main>
      </div>
    </div>
  );
}
