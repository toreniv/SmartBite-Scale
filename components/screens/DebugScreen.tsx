"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm font-medium text-slate-500">Debug information</div>
        <div className="mt-4 space-y-3">
          <Row label="Camera permissions" value={cameraPermission} />
          <Row label="BLE supported" value={supported ? "Yes" : "No"} />
          <Row label="BLE initialized" value={initialized ? "Yes" : "No"} />
          <Row label="Device connected" value={isConnected ? "Yes" : "No"} />
          <Row label="Raw live weight" value={`${latestWeight.toFixed(1)}g`} />
          <Row label="Stabilized weight" value={`${stableWeight.toFixed(1)}g`} />
          <Row label="Measurement status" value={measurementStatus} />
          <Row label="Serving event" value={lastServingEvent} />
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onTestCamera}>
            Test camera
          </Button>
          <Button variant="primary" fullWidth onClick={onTestBle}>
            Test BLE scan
          </Button>
        </div>

        <Button variant="ghost" fullWidth className="mt-3" onClick={onTare}>
          Tare scale
        </Button>
      </Card>
    </div>
  );
}
