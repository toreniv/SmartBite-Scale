"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Bluetooth, Loader2, RefreshCw, Scale, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import type { BluetoothConnectionStatus, DiscoveredDevice } from "@/lib/types";

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[28px] bg-slate-50 px-4 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500">
        {icon}
      </div>
      <div className="mt-4 text-base font-semibold text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

export function ConnectScreen({
  supported,
  bluetoothEnabled,
  devices,
  scanning,
  connecting,
  connectionStatus,
  permissionBlocked,
  noDevicesFound,
  lastMessage,
  onGrantPermission,
  onEnableBluetooth,
  onOpenSettings,
  onScan,
  onConnectDevice,
  onSkip,
  onCancel,
}: {
  supported: boolean;
  bluetoothEnabled: boolean;
  devices: DiscoveredDevice[];
  scanning: boolean;
  connecting: boolean;
  connectionStatus: BluetoothConnectionStatus;
  permissionBlocked: boolean;
  noDevicesFound: boolean;
  lastMessage: string;
  onGrantPermission: () => void;
  onEnableBluetooth: () => void;
  onOpenSettings: () => void;
  onScan: () => void;
  onConnectDevice: (device: DiscoveredDevice) => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  const { dir } = useLanguage();
  const needsPermission = connectionStatus === "permissions-denied";
  const needsBluetooth = !bluetoothEnabled && supported;

  return (
    <div
      dir={dir}
      className="mx-auto flex h-[100svh] max-h-[100svh] max-w-[430px] flex-col justify-center px-5"
      style={{
        paddingTop: "calc(1rem + env(safe-area-inset-top))",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
      }}
    >
      <Card>
        <div className="text-sm font-medium text-slate-500">Bluetooth Classic connection</div>
        <h2 className="mt-1 text-3xl font-semibold text-slate-950">Connect your HC-06 scale</h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            Status: {scanning ? "Scanning" : connecting ? "Connecting" : connectionStatus}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
            Bluetooth Classic
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {!supported ? (
            <EmptyState
              icon={<Bluetooth className="h-5 w-5" />}
              title="Android app required"
              body="Bluetooth Classic scanning is available in the Android build. Use demo mode on web."
            />
          ) : needsPermission && permissionBlocked ? (
            <EmptyState
              icon={<Settings className="h-5 w-5" />}
              title="Permission blocked"
              body="Go to Settings -> Apps -> SmartBite -> Permissions and enable Bluetooth."
            />
          ) : needsPermission ? (
            <EmptyState
              icon={<Bluetooth className="h-5 w-5" />}
              title="Bluetooth permission required"
              body="SmartBite needs Bluetooth access to connect to your scale."
            />
          ) : needsBluetooth ? (
            <EmptyState
              icon={<Bluetooth className="h-5 w-5" />}
              title="Bluetooth is off"
              body="Enable Bluetooth to connect to your scale."
            />
          ) : scanning && devices.length === 0 ? (
            <div className="rounded-[28px] bg-slate-50 px-4 py-8 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-slate-600">
                Looking for paired and discoverable Bluetooth Classic devices...
              </p>
            </div>
          ) : devices.length > 0 ? (
            devices.map((device) => (
              <div key={device.address} className="rounded-[28px] bg-slate-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900">{device.name}</div>
                      {device.isHc06 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          HC-06
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{device.address}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600">
                        Bluetooth Classic
                      </span>
                      {device.isPaired ? (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                          Paired
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                          Discoverable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-4"
                  fullWidth
                  onClick={() => onConnectDevice(device)}
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            ))
          ) : noDevicesFound ? (
            <EmptyState
              icon={<AlertTriangle className="h-5 w-5" />}
              title="No devices found"
              body="Make sure your HC-06 is powered on and paired with this phone."
            />
          ) : (
            <EmptyState
              icon={<Bluetooth className="h-5 w-5" />}
              title="Ready to scan"
              body="Scan for paired and discoverable Bluetooth Classic devices."
            />
          )}

          {lastMessage ? (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
              {lastMessage}
            </div>
          ) : null}

          {connectionStatus === "error" ? (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Connection failed. If HC-06 is not paired yet, pair it in Android settings first.</span>
            </div>
          ) : null}
        </div>

        {needsPermission && permissionBlocked ? (
          <Button className="mt-6" fullWidth onClick={onOpenSettings}>
            Open Settings
          </Button>
        ) : needsPermission ? (
          <Button className="mt-6" fullWidth onClick={onGrantPermission} disabled={!supported}>
            Grant Permission
          </Button>
        ) : needsBluetooth ? (
          <Button className="mt-6" fullWidth onClick={onEnableBluetooth} disabled={!supported}>
            Enable Bluetooth
          </Button>
        ) : noDevicesFound ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button fullWidth onClick={onScan}>
              Retry Scan
            </Button>
            <Button variant="secondary" fullWidth onClick={onSkip}>
              Skip for now
            </Button>
          </div>
        ) : (
          <Button className="mt-6" fullWidth onClick={onScan} disabled={!supported || scanning}>
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Scan devices
              </>
            )}
          </Button>
        )}

        {!noDevicesFound ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="ghost" fullWidth onClick={onSkip}>
              Demo mode
            </Button>
            <Button variant="ghost" fullWidth onClick={onCancel}>
              Back
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
