"use client";

import { Camera, ChartColumnIncreasing, History, Settings2 } from "lucide-react";
import type { AppSection } from "@/lib/types";
import { useLanguage } from "@/hooks/useLanguage";

const items: Array<{ id: AppSection; labelKey: string; icon: typeof Camera }> = [
  { id: "home", labelKey: "nav.home", icon: ChartColumnIncreasing },
  { id: "capture", labelKey: "nav.capture", icon: Camera },
  { id: "history", labelKey: "nav.history", icon: History },
  { id: "profile", labelKey: "nav.profile", icon: Settings2 },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: AppSection;
  onChange: (section: AppSection) => void;
}) {
  const { t } = useLanguage();

  return (
    <div
      className="fixed left-1/2 z-40 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 rounded-[28px] border border-white/70 bg-white/88 px-3 py-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 0.5rem)",
      }}
    >
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2.5 py-2 text-xs font-medium leading-none transition ${
                isActive ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
