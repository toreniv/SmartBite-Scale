"use client";

interface ProgressBarProps {
  value: number;
  max: number;
  colorClassName?: string;
}

export function ProgressBar({
  value,
  max,
  colorClassName = "bg-blue-500",
}: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));

  return (
    <div className="h-2.5 rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${colorClassName}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
