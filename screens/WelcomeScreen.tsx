"use client";

import { Bluetooth, Heart, Loader2 } from "lucide-react";

interface WelcomeScreenProps {
  scanning: boolean;
  onConnect: () => void;
  onContinueWithoutScale: () => void;
  onOpenDebug: () => void;
}

export function WelcomeScreen({
  scanning,
  onConnect,
  onContinueWithoutScale,
  onOpenDebug,
}: WelcomeScreenProps) {
  return (
    <div className="phone-frame flex flex-col justify-between px-5 pb-6 pt-5">
      <div className="flex justify-end">
        <button
          onClick={onOpenDebug}
          className="text-xs font-medium text-slate-500 underline-offset-4 hover:underline"
        >
          Debug
        </button>
      </div>

      <div className="px-2">
        <h1 className="text-center text-4xl font-bold tracking-tight text-blue-500">
          SmartBite Scale
        </h1>

        <div className="glass-card mt-8 rounded-[32px] px-6 py-8 text-center">
          <p className="mx-auto max-w-xs text-base leading-7 text-slate-600">
            Effortlessly track your meals with our smart solution
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={onConnect}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-70"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Bluetooth className="h-5 w-5" />
                  Connect Device
                </>
              )}
            </button>

            <button
              onClick={onContinueWithoutScale}
              className="w-full rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Continue Without Scale
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
        Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> by SmartBite
      </div>
    </div>
  );
}
