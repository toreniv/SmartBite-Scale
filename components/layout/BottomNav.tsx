"use client";

import { Camera, ChartColumnIncreasing, History, Settings2 } from "lucide-react";
import type { AppSection } from "@/lib/types";

const items: Array<{ id: AppSection; label: string; icon: typeof Camera }> = [
  { id: "home", label: "Home", icon: ChartColumnIncreasing },
  { id: "capture", label: "Capture", icon: Camera },
  { id: "history", label: "History", icon: History },
  { id: "profile", label: "Profile", icon: Settings2 },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: AppSection;
  onChange: (section: AppSection) => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 rounded-[28px] border border-white/70 bg-white/88 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                isActive ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
