"use client";

import { Bluetooth, Loader2, Signal } from "lucide-react";
import type { DiscoveredDevice } from "@/lib/types";

interface DeviceScanScreenProps {
  devices: DiscoveredDevice[];
  scanning: boolean;
  onSkip: () => void;
  onCancel: () => void;
}

export function DeviceScanScreen({
  devices,
  scanning,
  onSkip,
  onCancel,
}: DeviceScanScreenProps) {
  return (
    <div className="phone-frame flex flex-col px-5 pb-6 pt-8">
      <div className="glass-card rounded-[32px] px-5 py-6">
        <h2 className="text-2xl font-bold text-blue-500">Available Devices</h2>

        <div className="mt-5 space-y-3">
          {scanning && devices.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-500" />
              <p className="mt-3 text-sm text-slate-600">
                Select your SmartBite scale from the browser Bluetooth picker.
              </p>
            </div>
          ) : null}

          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-2 text-blue-500">
                  <Bluetooth className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{device.name}</div>
                  <div className="text-xs text-slate-500">
                    {device.signalStrength === null
                      ? "Signal strength unavailable"
                      : `${device.signalStrength} dBm`}
                  </div>
                </div>
              </div>

              <Signal className="h-5 w-5 text-slate-400" />
            </div>
          ))}

          {!scanning && devices.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No devices selected.
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Skip Connection
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
