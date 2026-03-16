"use client";

import { Activity, Bug, Scale } from "lucide-react";
import type { ReactNode } from "react";
import type { AppSection } from "@/lib/types";
import { BottomNav } from "@/components/layout/BottomNav";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";

export function MobileShell({
  children,
  activeSection,
  onChangeSection,
  connectionLabel,
  onOpenDebug,
}: {
  children: ReactNode;
  activeSection: AppSection;
  onChangeSection: (section: AppSection) => void;
  connectionLabel: string;
  onOpenDebug: () => void;
}) {
  const { dir, t } = useLanguage();

  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-[430px] px-4 pb-28 pt-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">
            {t("common.appName")}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {t("common.appTagline")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={onOpenDebug}
            aria-label={t("common.openDebugTools")}
            className="rounded-2xl bg-white/80 p-3 text-slate-600 shadow-sm"
          >
            <Bug className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-[24px] border border-white/60 bg-white/78 px-4 py-3 text-sm text-slate-600 backdrop-blur-xl">
        <Scale className="h-4 w-4 text-blue-500" />
        <span className="flex-1">{connectionLabel}</span>
        <Activity className="h-4 w-4 text-emerald-500" />
      </div>

      {children}
      <BottomNav active={activeSection} onChange={onChangeSection} />
    </div>
  );
}
