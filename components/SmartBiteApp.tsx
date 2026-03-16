"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { ConnectScreen } from "@/components/screens/ConnectScreen";
import { CaptureScreen } from "@/components/screens/CaptureScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { DebugScreen } from "@/components/screens/DebugScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { Card } from "@/components/ui/Card";
import { useBluetoothScale } from "@/hooks/useBluetoothScale";
import { useCamera } from "@/hooks/useCamera";
import { useMealAnalysis } from "@/hooks/useMealAnalysis";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { AppPhase, AppSection } from "@/lib/types";

export function SmartBiteApp() {
  const [phase, setPhase] = useState<AppPhase>("welcome");
  const [section, setSection] = useState<AppSection>("home");
  const [debugOpen, setDebugOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mealNote, setMealNote] = useState("");
  const [toast, setToast] = useState("");

  const bluetooth = useBluetoothScale();
  const camera = useCamera();
  const { profile, setProfile, metrics } = useUserProfile();
  const analysis = useMealAnalysis(profile, metrics.dailyCalorieTarget, metrics.proteinTarget);

  useEffect(() => {
    if (section !== "capture") {
      camera.stopCamera();
    }
  }, [section]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const measuredWeight = bluetooth.stableWeight || bluetooth.latestWeight || undefined;

  const showToast = (message: string) => {
    setToast(message);
  };

  const connectScale = async () => {
    setPhase("connect");
    const result = await bluetooth.connect();
    showToast(result.message);

    if (result.success) {
      setPhase("app");
      setSection("home");
    }
  };

  const continueWithoutScale = () => {
    bluetooth.enableBypassMode();
    setPhase("app");
    setSection("home");
  };

  const handleSelectUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const analyzeBlob = async (blob: Blob) => {
    try {
      await analysis.analyzeImage(blob, mealNote, measuredWeight);
      showToast("Meal estimate ready.");
      setSection("home");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Analysis failed.");
    }
  };

  const handleAnalyzeCamera = async () => {
    try {
      const blob = await camera.capturePhoto();
      await analyzeBlob(blob);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Camera capture failed.");
    }
  };

  const handleAnalyzeUpload = async () => {
    if (!selectedUploadFile) {
      showToast("Select an image first.");
      return;
    }

    await analyzeBlob(selectedUploadFile);
  };

  const latestMeal = analysis.history[0] ?? null;
  const latestResult = analysis.result ?? latestMeal;

  if (phase === "welcome") {
    return <WelcomeScreen onConnect={connectScale} onContinue={continueWithoutScale} />;
  }

  if (phase === "connect") {
    return (
      <ConnectScreen
        devices={bluetooth.devices}
        scanning={bluetooth.isConnecting}
        lastMessage={bluetooth.lastMessage}
        onRetry={connectScale}
        onSkip={continueWithoutScale}
        onCancel={() => setPhase("welcome")}
      />
    );
  }

  return (
    <main className="app-shell">
      <MobileShell
        activeSection={section}
        onChangeSection={setSection}
        connectionLabel={bluetooth.connectionLabel}
        onOpenDebug={() => setDebugOpen(true)}
      >
        {toast ? (
          <Card className="mb-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
            {toast}
          </Card>
        ) : null}

        {debugOpen ? (
          <DebugScreen
            cameraPermission={camera.permission}
            supported={bluetooth.supported}
            initialized={bluetooth.initialized}
            isConnected={bluetooth.isConnected}
            latestWeight={bluetooth.latestWeight}
            stableWeight={bluetooth.stableWeight}
            measurementStatus={bluetooth.measurementStatus}
            lastServingEvent={
              bluetooth.lastServingEvent
                ? `${new Date(bluetooth.lastServingEvent.detectedAt).toLocaleTimeString()} at ${bluetooth.lastServingEvent.grams}g`
                : "None"
            }
            onTestCamera={async () => {
              try {
                await camera.startCamera();
                camera.stopCamera();
                showToast("Camera test succeeded.");
              } catch (error) {
                showToast(error instanceof Error ? error.message : "Camera test failed.");
              }
            }}
            onTestBle={connectScale}
            onTare={async () => {
              const result = await bluetooth.tare();
              showToast(result.message);
            }}
          />
        ) : null}

        {!debugOpen && section === "home" ? (
          <DashboardScreen
            profile={profile}
            metrics={metrics}
            progress={analysis.dailyProgress}
            latestResult={latestResult}
            measuredWeight={measuredWeight ?? 0}
            disclaimer={analysis.disclaimer}
            recommendations={analysis.recommendations}
            isConnected={bluetooth.isConnected}
            latestWeight={bluetooth.latestWeight}
            stableWeight={bluetooth.stableWeight}
            measurementStatus={bluetooth.measurementStatus}
            onConnectScale={connectScale}
            onTare={async () => {
              const result = await bluetooth.tare();
              showToast(result.message);
            }}
            onGoCapture={() => setSection("capture")}
          />
        ) : null}

        {!debugOpen && section === "capture" ? (
          <CaptureScreen
            videoRef={camera.videoRef}
            previewUrl={previewUrl}
            note={mealNote}
            onNoteChange={setMealNote}
            onStartCamera={async () => {
              try {
                await camera.startCamera();
              } catch (error) {
                showToast(error instanceof Error ? error.message : "Camera failed.");
              }
            }}
            onStopCamera={camera.stopCamera}
            onAnalyzeCamera={handleAnalyzeCamera}
            onSelectFile={handleSelectUpload}
            onAnalyzeUpload={handleAnalyzeUpload}
            cameraReady={Boolean(camera.stream)}
            status={analysis.status}
            stableWeight={bluetooth.stableWeight}
            latestWeight={bluetooth.latestWeight}
            result={latestResult}
            disclaimer={analysis.disclaimer}
          />
        ) : null}

        {!debugOpen && section === "history" ? <HistoryScreen meals={analysis.history} /> : null}

        {!debugOpen && section === "profile" ? (
          <ProfileScreen
            profile={profile}
            onChange={setProfile}
            metrics={metrics}
            onOpenDebug={() => setDebugOpen(true)}
          />
        ) : null}

        {debugOpen ? (
          <button
            onClick={() => setDebugOpen(false)}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Back to app
          </button>
        ) : null}

        {!debugOpen && latestMeal ? (
          <p className="mt-4 px-1 text-xs leading-5 text-slate-400">
            Estimated nutrition values are guidance only and may vary from the real meal.
          </p>
        ) : null}
      </MobileShell>
    </main>
  );
}
