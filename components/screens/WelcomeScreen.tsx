"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bluetooth,
  BrainCircuit,
  Camera,
  ChevronRight,
  Scale,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { AuthScreen } from "@/components/screens/AuthScreen";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { getCurrentUser } from "@/lib/localAuth";
import type { User } from "@/lib/types";

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[12px] font-semibold tracking-tight text-slate-900">{title}</div>
        <div className="text-[11px] leading-4 text-slate-500">{description}</div>
      </div>
    </div>
  );
}

export function WelcomeScreen({
  onConnect,
  onContinue,
  onAuthChange,
}: {
  onConnect: () => void;
  onContinue: () => void;
  onAuthChange?: () => void;
}) {
  const { dir, t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const syncUser = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const bannerInitial = currentUser?.name?.trim().charAt(0).toUpperCase() || "U";

  const run = (action: () => void) => {
    if (busy) {
      return;
    }

    setBusy(true);
    timerRef.current = window.setTimeout(() => {
      action();
    }, 320);
  };

  return (
    <div
      dir={dir}
      className="relative mx-auto flex h-[100dvh] max-w-[430px] flex-col overflow-hidden bg-[linear-gradient(180deg,#f0f5ff_0%,#e8f0fe_100%)] px-5"
    >
      <div className="pointer-events-none absolute right-[-15%] top-[5%] h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none absolute left-[-10%] top-[30%] h-40 w-40 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="relative flex shrink-0 items-center justify-between pt-3 pb-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-blue-600" />
          {t("common.smartNutrition")}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/78 shadow-sm ring-1 ring-white/80 backdrop-blur-md"
            aria-label={currentUser ? "Open account" : "Open sign in"}
          >
            {currentUser ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#4338ca)] text-sm font-semibold text-white shadow-md">
                {bannerInitial}
              </div>
            ) : (
              <>
                <UserCircle2 className="h-6 w-6 text-slate-600" />
                <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative shrink-0 pt-0.5">
        <h1 className="text-[2.4rem] font-semibold leading-[1.0] tracking-[-0.05em] text-slate-950">
          SmartBite
          <br />
          <span className="text-slate-950/70">Scale.</span>
        </h1>
        <p className="mt-1 text-[0.9rem] text-slate-600">{t("welcome.subtitle")}</p>
      </div>

      <div className="relative mt-2.5 min-h-0 flex-1">
        <div className="h-full overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,247,255,0.82))] shadow-[0_20px_50px_rgba(30,64,175,0.12)] ring-1 ring-white/80 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2 px-4 pt-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("common.weightPhotoAi")}
              </div>
              <div className="mt-0.5 text-[13px] font-semibold tracking-tight text-slate-950">
                {t("welcome.heroTitle")}
              </div>
            </div>
            <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {t("common.live")}
            </div>
          </div>

          <div className="mx-4 mt-2.5 rounded-[20px] bg-[linear-gradient(180deg,#111827,#1e293b)] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  {t("welcome.scaleReading")}
                </div>
                <div className="mt-0.5 text-[1.3rem] font-semibold tracking-tight text-white">
                  186 {t("common.gramsShort")}
                </div>
              </div>
              <div className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-300">
                {t("welcome.stableServing")}
              </div>
            </div>

            <div className="flex items-center justify-center py-1.5">
              <img
                src="/assets/scale/sbs3.png"
                alt="Salmon & Avocado Bowl on SmartBite Scale"
                className="w-full h-[160px] rounded-[14px] object-cover select-none"
                style={{
                  filter: "brightness(0.92) saturate(1.05)",
                }}
                draggable={false}
              />
            </div>

            <div className="grid grid-cols-[36px_1fr] gap-2 rounded-[16px] bg-white/8 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[linear-gradient(160deg,#fde68a,#fb923c)]">
                <Scale className="h-4 w-4 text-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                  <Camera className="h-2.5 w-2.5" />
                  {t("welcome.mealImageMatched")}
                </div>
                <div className="mt-0.5 text-[12px] font-semibold text-white">
                  Salmon &amp; Avocado Bowl
                </div>
                <div className="text-[10px] text-slate-400">AI-powered nutritional analysis</div>
              </div>
            </div>
          </div>

          <div className="mx-4 mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-[16px] bg-white/80 px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                <BrainCircuit className="h-2.5 w-2.5 text-indigo-500" />
                {t("welcome.aiEstimate")}
              </div>
              <div className="mt-1 text-[1.3rem] font-semibold tracking-tight text-slate-950">
                580
              </div>
              <div className="text-[10px] text-slate-500">{t("common.calories")}</div>
            </div>
            <div className="rounded-[16px] bg-white/80 px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                <Scale className="h-2.5 w-2.5 text-blue-500" />
                {t("welcome.macroFocus")}
              </div>
              <div className="mt-1 text-[1.3rem] font-semibold tracking-tight text-slate-950">
                42g
              </div>
              <div className="text-[10px] text-slate-500">{t("common.protein")}</div>
            </div>
          </div>

          <div className="mx-4 mt-2.5 mb-3 grid gap-2">
            <FeatureItem
              icon={<Scale className="h-4 w-4 text-blue-600" />}
              title={t("welcome.featureLiveTitle")}
              description={t("welcome.featureLiveBody")}
            />
            <FeatureItem
              icon={<Camera className="h-4 w-4 text-amber-500" />}
              title={t("welcome.featurePhotoTitle")}
              description={t("welcome.featurePhotoBody")}
            />
            <FeatureItem
              icon={<BrainCircuit className="h-4 w-4 text-indigo-500" />}
              title={t("welcome.featureGuidanceTitle")}
              description={t("welcome.featureGuidanceBody")}
            />
          </div>
        </div>
      </div>

      <div className="relative shrink-0 pb-5 pt-2.5">
        <Button
          fullWidth
          onClick={() => run(onConnect)}
          disabled={busy}
          className="h-13 rounded-[24px] bg-[linear-gradient(135deg,#1d4ed8,#4338ca,#6366f1)] text-[15px] font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
        >
          <Bluetooth className="mr-2 h-5 w-5" />
          {t("common.connectScale")}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => run(onContinue)}
          disabled={busy}
          className="mt-2 h-11 rounded-[20px] bg-white/60 text-slate-700 backdrop-blur-md"
        >
          {t("common.tryDemoMode")}
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="mt-2 text-center text-[10px] tracking-wide text-slate-400">
          {t("common.productName")}
        </p>
      </div>

      <AnimatePresence>
        {authOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close account sheet"
              className="absolute inset-0 bg-slate-950/28"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setAuthOpen(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 z-10 rounded-t-[32px] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(239,246,255,0.96))] px-4 pb-6 pt-3 shadow-[0_-24px_60px_rgba(15,23,42,0.18)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-300" />
              <div className="mt-3 flex items-center justify-between px-1">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Your account</div>
                  <div className="text-xs text-slate-500">
                    Sign in to save your profile on this device.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 max-h-[70vh] overflow-y-auto">
                <AuthScreen
                  embedded
                  onAuth={() => {
                    setCurrentUser(getCurrentUser());
                    setAuthOpen(false);
                    onAuthChange?.();
                  }}
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
