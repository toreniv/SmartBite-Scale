"use client";

interface ModalProps {
  message: string;
  onClose: () => void;
}

export function Modal({ message, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="glass-card w-full max-w-sm rounded-[28px] p-6">
        <p className="text-sm leading-6 text-slate-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          OK
        </button>
      </div>
    </div>
  );
}
