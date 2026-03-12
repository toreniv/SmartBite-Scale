"use client";

import type { LucideIcon } from "lucide-react";

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function MenuButton({ icon: Icon, label, onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="glass-card flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-[28px] p-4 text-center transition hover:-translate-y-0.5"
    >
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-500">
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-sm font-semibold text-blue-600">{label}</span>
    </button>
  );
}
