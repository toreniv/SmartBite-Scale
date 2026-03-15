"use client";

import { Bluetooth, Loader2, ScanSearch, Signal } from "lucide-react";
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
  const hasDevices = devices.length > 0;

  return (
    <div className="phone-frame flex flex-col px-5 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="badge-chip">Step 2 of 3</div>
        <button onClick={onCancel} className="ghost-button !w-auto px-4 py-2 text-xs">
          Cancel
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">
            Pair your SmartBite Scale
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Choose your scale in the browser Bluetooth picker. We will finish the handshake and
            prepare the dashboard automatically.
          </p>
        </div>

        <div className="surface-card-strong rounded-[34px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">Nearby devices</div>
              <p className="mt-1 text-sm text-slate-500">
                {scanning
                  ? "Searching and validating a secure connection."
                  : hasDevices
                    ? "Your selected scale is ready to finish pairing."
                    : "No device has been selected yet."}
              </p>
            </div>
            <div
              className={`status-pill ${
                scanning
                  ? "bg-blue-50 text-blue-700"
                  : hasDevices
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching
                </>
              ) : hasDevices ? (
                <>Selected</>
              ) : (
                <>Waiting</>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {scanning && !hasDevices ? (
              <div className="empty-state-card px-4 py-5">
                <div className="flex items-center gap-3">
                  <div className="icon-surface bg-blue-100 text-blue-600">
                    <ScanSearch className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Looking for your scale
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Keep Bluetooth enabled and select SmartBite when the browser prompt appears.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-[24px] bg-white/70 px-4 py-4"
                    >
                      <div className="skeleton-block h-11 w-11 rounded-2xl" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="skeleton-block h-4 w-28" />
                        <div className="skeleton-block h-3 w-20" />
                      </div>
                      <div className="skeleton-block h-5 w-5 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {devices.map((device) => (
              <div
                key={device.id}
                className="empty-state-card flex items-center justify-between gap-3 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-surface bg-blue-100 text-blue-600">
                    <Bluetooth className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{device.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {device.signalStrength === null
                        ? "Signal strength unavailable"
                        : `${device.signalStrength} dBm`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-slate-500">
                  <Signal className="h-4 w-4 text-emerald-500" />
                  Ready
                </div>
              </div>
            ))}

            {!scanning && !hasDevices ? (
              <div className="empty-state-card px-4 py-8 text-center">
                <Bluetooth className="mx-auto h-8 w-8 text-slate-300" />
                <div className="mt-3 text-sm font-semibold text-slate-900">No scale selected</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You can skip for now and continue with the mobile experience while keeping the
                  scale disconnected.
                </p>
              </div>
            ) : null}
          </div>

          <div className="soft-divider my-5" />

          <div className="flex gap-3">
            <button onClick={onSkip} className="secondary-button">
              Skip for now
            </button>
            <button onClick={onCancel} className="ghost-button">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
