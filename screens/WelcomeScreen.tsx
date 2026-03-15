"use client";

import { Bluetooth, ChevronRight, Heart, Loader2, ScanLine, Sparkles } from "lucide-react";

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
  const onboardingPoints = [
    {
      icon: Bluetooth,
      title: "Pair once",
      body: "Connect your SmartBite Scale to unlock live serving weights.",
    },
    {
      icon: ScanLine,
      title: "Capture meals",
      body: "Use the camera or upload a photo when you are ready to analyze.",
    },
    {
      icon: Sparkles,
      title: "Review calmly",
      body: "See a cleaner, more premium dashboard experience built for nutrition tracking.",
    },
  ];

  return (
    <div className="phone-frame flex flex-col justify-between px-5 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="badge-chip">SmartBite Scale</div>
        <button onClick={onOpenDebug} className="ghost-button !w-auto px-4 py-2 text-xs">
          Debug
        </button>
      </div>

      <div className="space-y-6 py-6">
        <div className="space-y-4">
          <div className="text-sm font-semibold uppercase tracking-[0.26em] text-blue-500/80">
            Minimal nutrition-tech
          </div>
          <div className="space-y-3">
            <h1 className="max-w-sm text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950">
              Track meals with
              <span className="brand-gradient-text"> calm precision.</span>
            </h1>
            <p className="max-w-sm text-base leading-7 text-slate-600">
              SmartBite turns a connected scale and a quick food photo into a softer, more focused
              nutrition workflow.
            </p>
          </div>
        </div>

        <div className="surface-card-strong rounded-[36px] p-6">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(219,234,254,0.9),rgba(240,249,255,0.76))] p-5">
            <div className="badge-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Guided onboarding
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Start in under a minute
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Connect your scale now for the best measurement quality, or continue with image-only
              analysis and add the hardware later.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <button onClick={onConnect} disabled={scanning} className="primary-button">
              {scanning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching for your scale
                </>
              ) : (
                <>
                  <Bluetooth className="h-5 w-5" />
                  Connect SmartBite Scale
                </>
              )}
            </button>

            <button onClick={onContinueWithoutScale} className="secondary-button">
              Continue without scale
            </button>
          </div>

          <div className="soft-divider my-5" />

          <div className="grid gap-3">
            {onboardingPoints.map((point) => {
              const Icon = point.icon;

              return (
                <div key={point.title} className="empty-state-card flex items-start gap-4 px-4 py-4">
                  <div className="icon-surface bg-white text-blue-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{point.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{point.body}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-slate-300" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
        Crafted for better meal awareness
        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
      </div>
    </div>
  );
}
