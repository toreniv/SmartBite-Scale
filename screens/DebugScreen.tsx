"use client";

import { SlidersHorizontal } from "lucide-react";
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
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
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
    <div className="phone-frame flex flex-col px-5 pb-8 pt-8">
      <div className="glass-card w-full rounded-[32px] p-5">
        <h2 className="text-2xl font-bold text-blue-500">Debug Information</h2>

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
          <button
            onClick={onTestCamera}
            className="flex-1 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Test Camera
          </button>
          <button
            onClick={onTestBleScan}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Test BLE Scan
          </button>
        </div>

        {deviceConnected ? (
          <>
            <div className="mt-5">
              <div className="mb-2 text-sm font-semibold text-slate-600">LED Commands</div>
              <div className="grid grid-cols-3 gap-2">
                {LED_COMMANDS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onLedCommand(color)}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                      selectedLED === color
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
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

      <button
        onClick={onBack}
        className="mt-6 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/50 transition hover:bg-blue-600"
      >
        Back to Main Menu
      </button>
    </div>
  );
}
