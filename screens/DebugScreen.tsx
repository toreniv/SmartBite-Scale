"use client";

import { ArrowLeft, Cpu, SlidersHorizontal } from "lucide-react";
import { LED_COMMANDS } from "@/lib/constants";
import type { LEDColor, PermissionStateLike } from "@/lib/types";

interface DebugScreenProps {
  bleInitialized: boolean;
  brightness: number;
  cameraPermission: PermissionStateLike;
  currentWeight: number;
  deviceConnected: boolean;
  isNative: boolean;
  platform: string;
  selectedLED: LEDColor | "";
  onBack: () => void;
  onBrightnessChange: (value: number) => void;
  onLedCommand: (color: LEDColor) => void;
  onTestBleScan: () => void;
  onTestCamera: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function DebugScreen({
  bleInitialized,
  brightness,
  cameraPermission,
  currentWeight,
  deviceConnected,
  isNative,
  platform,
  selectedLED,
  onBack,
  onBrightnessChange,
  onLedCommand,
  onTestBleScan,
  onTestCamera,
}: DebugScreenProps) {
  return (
    <div className="phone-frame flex flex-col px-5 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="badge-chip">Debug</div>
        <button onClick={onBack} className="ghost-button !w-auto px-4 py-2 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mt-5 surface-card-strong w-full rounded-[34px] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
              Device diagnostics
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Internal controls and environment details for testing the SmartBite flow.
            </p>
          </div>
          <div className="icon-surface bg-blue-100 text-blue-600">
            <Cpu className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Row label="Is Native" value={isNative ? "Yes" : "No"} />
          <Row label="Platform" value={platform} />
          <Row label="Camera Permissions" value={cameraPermission} />
          <Row label="BLE Initialized" value={bleInitialized ? "Yes" : "No"} />
          <Row label="Device Connected" value={deviceConnected ? "Yes" : "No"} />
          <Row
            label="Current Weight"
            value={deviceConnected ? `${currentWeight.toFixed(1)}g` : "Unavailable"}
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onTestCamera} className="primary-button">
            Test Camera
          </button>
          <button onClick={onTestBleScan} className="secondary-button">
            Test BLE Scan
          </button>
        </div>

        {deviceConnected ? (
          <>
            <div className="mt-6 rounded-[28px] bg-slate-50 px-4 py-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">LED Commands</div>
              <div className="grid grid-cols-3 gap-2">
                {LED_COMMANDS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onLedCommand(color)}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                      selectedLED === color
                        ? "bg-blue-500 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[28px] bg-slate-50 px-4 py-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <SlidersHorizontal className="h-4 w-4" />
                Brightness
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={brightness}
                onChange={(event) => onBrightnessChange(Number(event.target.value))}
                className="w-full"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
