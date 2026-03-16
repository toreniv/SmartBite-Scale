"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import type { PermissionStateLike } from "@/lib/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function DebugScreen({
  cameraPermission,
  supported,
  initialized,
  isConnected,
  latestWeight,
  stableWeight,
  measurementStatus,
  lastServingEvent,
  onTestCamera,
  onTestBle,
  onTare,
}: {
  cameraPermission: PermissionStateLike;
  supported: boolean;
  initialized: boolean;
  isConnected: boolean;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: string;
  lastServingEvent: string;
  onTestCamera: () => void;
  onTestBle: () => void;
  onTare: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm font-medium text-slate-500">{t("debug.title")}</div>
        <div className="mt-4 space-y-3">
          <Row label={t("debug.cameraPermissions")} value={cameraPermission} />
          <Row label={t("debug.bleSupported")} value={supported ? t("common.yes") : t("common.no")} />
          <Row label={t("debug.bleInitialized")} value={initialized ? t("common.yes") : t("common.no")} />
          <Row label={t("debug.deviceConnected")} value={isConnected ? t("common.yes") : t("common.no")} />
          <Row
            label={t("debug.rawLiveWeight")}
            value={`${latestWeight.toFixed(1)}${t("common.gramsShort")}`}
          />
          <Row
            label={t("debug.stabilizedWeight")}
            value={`${stableWeight.toFixed(1)}${t("common.gramsShort")}`}
          />
          <Row
            label={t("debug.measurementStatus")}
            value={t(`common.measurementStatus.${measurementStatus}`)}
          />
          <Row label={t("debug.servingEvent")} value={lastServingEvent || t("common.none")} />
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onTestCamera}>
            {t("debug.testCamera")}
          </Button>
          <Button variant="primary" fullWidth onClick={onTestBle}>
            {t("debug.testBleScan")}
          </Button>
        </div>

        <Button variant="ghost" fullWidth className="mt-3" onClick={onTare}>
          {t("debug.tareScale")}
        </Button>
      </Card>
    </div>
  );
}
