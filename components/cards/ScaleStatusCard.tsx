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
  latestWeight,
  stableWeight,
  measurementStatus,
  onConnect,
  onTare,
}: {
  isConnected: boolean;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: MeasurementStatus;
  onConnect: () => void;
  onTare: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{t("dashboard.scaleStatus")}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            {isConnected
              ? t("dashboard.readyForMeasurement")
              : t("dashboard.connectForMeasuredWeight")}
          </div>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Scale className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[measurementStatus]}`}>
          {t(`common.measurementStatus.${measurementStatus}`)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Radio className="h-4 w-4 text-blue-500" />
            {t("dashboard.liveWeight")}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {latestWeight.toFixed(1)}
            {t("common.gramsShort")}
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Ruler className="h-4 w-4 text-emerald-500" />
            {t("dashboard.stableWeight")}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {stableWeight.toFixed(1)}
            {t("common.gramsShort")}
          </div>
        </div>
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
