"use client";

import { Radio, Ruler, Scale } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import type { MeasurementStatus } from "@/lib/types";

const statusTone: Record<MeasurementStatus, string> = {
  disconnected: "bg-slate-100 text-slate-500",
  idle: "bg-slate-100 text-slate-600",
  measuring: "bg-amber-100 text-amber-700",
  stable: "bg-emerald-100 text-emerald-700",
};

export function ScaleStatusCard({
  isConnected,
  isDemoMode,
  latestWeight,
  stableWeight,
  measurementStatus,
  onConnect,
  onTare,
}: {
  isConnected: boolean;
  isDemoMode: boolean;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: MeasurementStatus;
  onConnect: () => void;
  onTare: () => void;
}) {
  const { t } = useLanguage();
  const estimatedWeight = stableWeight || latestWeight;
  const showStableServing = isConnected && measurementStatus === "stable" && stableWeight > 0;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{t("dashboard.scaleStatus")}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            {isConnected
              ? t("dashboard.readyForMeasurement")
              : isDemoMode
                ? "Demo Mode active"
                : t("dashboard.connectForMeasuredWeight")}
          </div>
          {isDemoMode ? (
            <p className="mt-2 max-w-[28ch] text-sm leading-6 text-slate-600">
              Simulates scale activity and AI meal analysis, but weight readings are estimated -
              not measured by real hardware.
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Scale className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isDemoMode ? "bg-slate-100 text-slate-500" : statusTone[measurementStatus]
          }`}
        >
          {isDemoMode ? "Estimated readings" : t(`common.measurementStatus.${measurementStatus}`)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {isDemoMode ? (
          <div className="col-span-2 rounded-3xl bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Ruler className="h-4 w-4 text-slate-400" />
              Demo estimate
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">
              ~{estimatedWeight.toFixed(0)}
              {t("common.gramsShort")}
            </div>
            <div className="mt-1 text-xs text-slate-400">estimated weight</div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Radio className="h-4 w-4 text-blue-500" />
                {t("dashboard.liveWeight")}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {latestWeight.toFixed(1)}
                {t("common.gramsShort")}
              </div>
              {isConnected ? (
                <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live from scale hardware
                </div>
              ) : null}
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-emerald-500" />
                  {t("dashboard.stableWeight")}
                </div>
                {showStableServing ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                    Stable serving
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {stableWeight.toFixed(1)}
                {t("common.gramsShort")}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant={isConnected ? "secondary" : "primary"} onClick={onConnect} fullWidth>
          {isConnected ? t("dashboard.reconnectScale") : t("common.connectScale")}
        </Button>
        <Button variant="ghost" onClick={onTare} fullWidth>
          {t("dashboard.tare")}
        </Button>
      </div>
    </Card>
  );
}
