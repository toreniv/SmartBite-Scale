"use client";

import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import type { DiscoveredDevice } from "@/lib/types";

export function ConnectScreen({
  devices,
  scanning,
  lastMessage,
  onRetry,
  onSkip,
  onCancel,
}: {
  devices: DiscoveredDevice[];
  scanning: boolean;
  lastMessage: string;
  onRetry: () => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  const { dir, t } = useLanguage();

  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-[430px] px-5 pt-8">
      <Card>
        <div className="text-sm font-medium text-slate-500">{t("connect.eyebrow")}</div>
        <h2 className="mt-1 text-3xl font-semibold text-slate-950">{t("connect.title")}</h2>

        <div className="mt-5 space-y-3">
          {scanning && devices.length === 0 ? (
            <div className="rounded-[28px] bg-slate-50 px-4 py-8 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-slate-600">
                {t("connect.pickerHelp")}
              </p>
            </div>
          ) : null}

          {devices.map((device) => (
            <div key={device.id} className="rounded-[28px] bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{device.name}</div>
                  <div className="text-sm text-slate-500">
                    {device.signalStrength === null
                      ? t("connect.signalUnavailable")
                      : `${device.signalStrength} dBm`}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {lastMessage ? (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
              {lastMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" fullWidth onClick={onRetry}>
            {t("connect.retryScan")}
          </Button>
          <Button variant="ghost" fullWidth onClick={onSkip}>
            {t("connect.skipForNow")}
          </Button>
        </div>

        <Button variant="ghost" fullWidth className="mt-3" onClick={onCancel}>
          {t("common.back")}
        </Button>
      </Card>
    </div>
  );
}
