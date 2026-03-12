"use client";

interface RingProgressProps {
  value: number;
  total: number;
  label: string;
  detail: string;
}

export function RingProgress({ value, total, label, detail }: RingProgressProps) {
  const progress = Math.max(0, Math.min(100, (value / Math.max(total, 1)) * 100));

  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#2563eb ${progress}%, #dbeafe ${progress}% 100%)`,
        }}
      >
        <div className="grid h-18 w-18 place-items-center rounded-full bg-white text-center">
          <div className="text-lg font-semibold text-slate-900">{Math.round(progress)}%</div>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{detail}</div>
      </div>
    </div>
  );
}
