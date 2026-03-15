"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  accent?: "blue" | "mint" | "amber" | "slate";
  onClick: () => void;
}

const accentStyles = {
  blue: {
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-700",
  },
  mint: {
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-700",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-700",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600",
    text: "text-slate-700",
  },
} as const;

export function MenuButton({
  icon: Icon,
  label,
  description,
  accent = "blue",
  onClick,
}: MenuButtonProps) {
  const palette = accentStyles[accent];

  return (
    <button
      onClick={onClick}
      className="surface-card group flex min-h-[156px] w-full flex-col justify-between rounded-[30px] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(76,119,197,0.16)]"
    >
      <div className={`icon-surface w-fit ${palette.icon}`}>
        <Icon className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <div className={`text-base font-semibold ${palette.text}`}>{label}</div>
        <p className="text-sm leading-6 text-slate-500">
          {description ?? "Open this action and continue your SmartBite flow."}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-slate-400">
        <span>Open</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
