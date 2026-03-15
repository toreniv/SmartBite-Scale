"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface ModalProps {
  message: string;
  onClose: () => void;
}

export function Modal({ message, onClose }: ModalProps) {
  const isWarning = /fail|denied|unavailable|not supported|error/i.test(message);
  const isSuccess = !isWarning && /success|complete|ready|sent/i.test(message);
  const Icon = isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Info;
  const title = isWarning ? "Attention needed" : isSuccess ? "All set" : "Update";
  const iconClass = isWarning
    ? "bg-amber-100 text-amber-600"
    : isSuccess
      ? "bg-emerald-100 text-emerald-600"
      : "bg-blue-100 text-blue-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/34 px-4 backdrop-blur-md">
      <div className="surface-card-strong w-full max-w-sm rounded-[32px] p-6">
        <div className="flex items-start gap-4">
          <div className={`icon-surface ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="secondary-button mt-6"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
