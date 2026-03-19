//components/SmartBiteApp.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { ConnectScreen } from "@/components/screens/ConnectScreen";
import { CaptureScreen } from "@/components/screens/CaptureScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { DebugScreen } from "@/components/screens/DebugScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { AuthScreen } from "@/components/screens/AuthScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { Card } from "@/components/ui/Card";
import { useBluetoothScale } from "@/hooks/useBluetoothScale";
import { useCamera } from "@/hooks/useCamera";
import { useLanguage } from "@/hooks/useLanguage";
import { useMealAnalysis } from "@/hooks/useMealAnalysis";
import { useUserProfile } from "@/hooks/useUserProfile";
import { STORAGE_KEYS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/localAuth";
import { readStorage, writeStorage } from "@/lib/storage";
import type { AppPhase, AppSection, NavDirection, User } from "@/lib/types";

const TAB_ORDER: AppSection[] = ["home", "capture", "history", "profile"];
const DEFAULT_CALIBRATION_FACTOR = -7050;

export function SmartBiteApp() {
  const { dir, t } = useLanguage();
  const [phase, setPhase] = useState<AppPhase>("welcome");
  const [section, setSection] = useState<AppSection>("home");
  const [navDirection, setNavDirection] = useState<NavDirection>("none");
  const [debugOpen, setDebugOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mealNote, setMealNote] = useState("");
  const [toast, setToast] = useState("");
  const [profileAuthOpen, setProfileAuthOpen] = useState(false);
  const [calibrationFactor, setCalibrationFactor] = useState(DEFAULT_CALIBRATION_FACTOR);
  const [lastAnalysisRequest, setLastAnalysisRequest] = useState<{
    blob: Blob;
    note: string;
    measuredWeight?: number;
  } | null>(null);

  const bluetooth = useBluetoothScale();
  const camera = useCamera();
  const { profile, setProfile, metrics } = useUserProfile();
  const analysis = useMealAnalysis(profile, metrics.dailyCalorieTarget, metrics.proteinTarget);
  const previousReconnectStateRef = useRef(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const syncUser = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    if (section !== "capture") {
      camera.stopCamera();
    }
  }, [camera, section]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const wasReconnecting = previousReconnectStateRef.current;
    const isRecovered =
      wasReconnecting &&
      bluetooth.isConnected &&
      bluetooth.hasConfirmedPong &&
      !bluetooth.isReconnecting;

    if (isRecovered) {
      showToast("Scale reconnected \u2713");
      bluetooth.dismissBanner();
    }

    previousReconnectStateRef.current = bluetooth.isReconnecting;
  }, [bluetooth.hasConfirmedPong, bluetooth.isConnected, bluetooth.isReconnecting]);

  useEffect(() => {
    setCalibrationFactor(
      readStorage<number>(STORAGE_KEYS.scaleCalibration, DEFAULT_CALIBRATION_FACTOR),
    );
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const measuredWeight = bluetooth.isConnected
    ? bluetooth.stableWeight || bluetooth.latestWeight || undefined
    : undefined;
  const connectionLabel = bluetooth.connectionLabel;
  const connectionTone = bluetooth.isConnected && bluetooth.hasConfirmedPong
    ? "connected"
    : bluetooth.isReconnecting || bluetooth.isConnecting
      ? "reconnecting"
      : "disconnected";

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleAuthSuccess = () => {
    setCurrentUser(getCurrentUser());
    setProfileAuthOpen(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setProfileAuthOpen(false);
  };

  const handleSectionChange = (newSection: AppSection) => {
    const prevIndex = TAB_ORDER.indexOf(section);
    const nextIndex = TAB_ORDER.indexOf(newSection);

    const direction: NavDirection =
      prevIndex === -1 || nextIndex === -1 || nextIndex === prevIndex
        ? "none"
        : nextIndex > prevIndex
          ? "forward"
          : "backward";

    setNavDirection(direction);
    setSection(newSection);

    if (newSection !== "profile") {
      setProfileAuthOpen(false);
    }
  };

  const connectScale = async () => {
    setPhase("connect");
    void bluetooth.scan();
  };

  const handleConnectDevice = async (deviceAddress: string) => {
    const device = bluetooth.devices.find((entry) => entry.address === deviceAddress);

    if (!device) {
      showToast("Device is no longer available. Scan again.");
      return;
    }

    const result = await bluetooth.connectDevice(device);
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

  const saveCalibrationFactor = (value: number) => {
    setCalibrationFactor(value);
    writeStorage(STORAGE_KEYS.scaleCalibration, value);
    showToast("Saved locally, not yet applied to hardware");
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

  const analyzeBlob = async (
    blob: Blob,
    options?: {
      note?: string;
      measuredWeight?: number;
    },
  ) => {
    const analysisWeight = options?.measuredWeight ?? measuredWeight;
    const analysisNote = options?.note ?? mealNote;

    setLastAnalysisRequest({
      blob,
      note: analysisNote,
      measuredWeight: analysisWeight,
    });

    try {
      if (bluetooth.isBypassMode && analysisWeight) {
        bluetooth.lockDemoWeight(analysisWeight);
      }

      await analysis.analyzeImage(blob, analysisNote, analysisWeight);
      showToast(t("toasts.mealEstimateReady"));
      setSection("home");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("toasts.analysisFailed"));
    }
  };

  const handleAnalyzeCamera = async () => {
    try {
      const blob = await camera.capturePhoto();
      await analyzeBlob(blob);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("toasts.cameraCaptureFailed"));
    }
  };

  const handleAnalyzeUpload = async () => {
    if (!selectedUploadFile) {
      showToast(t("toasts.selectImageFirst"));
      return;
    }

    await analyzeBlob(selectedUploadFile);
  };

  const handleRetryAnalysis = async () => {
    if (!lastAnalysisRequest) {
      return;
    }

    await analyzeBlob(lastAnalysisRequest.blob, {
      note: lastAnalysisRequest.note,
      measuredWeight: lastAnalysisRequest.measuredWeight,
    });
  };

  const latestMeal = analysis.history[0] ?? null;
  const latestResult = analysis.result ?? latestMeal;
  const latestResultImageUrl = latestMeal?.imageDataUrl ?? previewUrl;
  const latestMealWeight = latestMeal?.measuredWeightGrams ?? measuredWeight ?? null;
  const lastServingEvent = bluetooth.lastServingEvent
    ? t("bluetooth.servingEventAt", {
        time: new Date(bluetooth.lastServingEvent.detectedAt).toLocaleTimeString(),
        grams: bluetooth.lastServingEvent.grams,
      })
    : t("common.none");
  const activeScreenKey = debugOpen
    ? `debug-${section}`
    : section === "profile" && profileAuthOpen
      ? "profile-auth"
      : section;

  let activeScreen = null;

  if (debugOpen) {
    activeScreen = (
      <DebugScreen
        cameraPermission={camera.permission}
        supported={bluetooth.supported}
        initialized={bluetooth.initialized}
        isConnected={bluetooth.isConnected}
        latestWeight={bluetooth.latestWeight}
        stableWeight={bluetooth.stableWeight}
        measurementStatus={bluetooth.measurementStatus}
        lastServingEvent={lastServingEvent}
        onTestCamera={async () => {
          try {
            await camera.startCamera();
            camera.stopCamera();
            showToast(t("toasts.cameraTestSucceeded"));
          } catch (error) {
            showToast(error instanceof Error ? error.message : t("toasts.cameraTestFailed"));
          }
        }}
        onTestBle={connectScale}
        onTare={async () => {
          const result = await bluetooth.tare();
          showToast(result.message);
        }}
      />
    );
  } else if (section === "home") {
    activeScreen = (
        <DashboardScreen
          profile={profile}
          metrics={metrics}
          progress={analysis.dailyProgress}
          latestResult={latestResult}
          latestResultImageUrl={latestResultImageUrl}
          measuredWeight={latestMealWeight}
          disclaimer={analysis.disclaimer}
          recommendations={analysis.recommendations}
        isConnected={bluetooth.isConnected}
        isDemoMode={bluetooth.isBypassMode}
        bluetoothEnabled={bluetooth.bluetoothEnabled}
        connectionStatus={bluetooth.connectionStatus}
        isReconnecting={bluetooth.isReconnecting}
        isStreamEnabled={bluetooth.isStreamEnabled}
        hasConfirmedPong={bluetooth.hasConfirmedPong}
        latestWeight={bluetooth.latestWeight}
        stableWeight={bluetooth.stableWeight}
        measurementStatus={bluetooth.measurementStatus}
        lastBluetoothMessage={bluetooth.lastMessage}
        navDirection={navDirection}
        onConnectScale={connectScale}
        onTare={async () => {
          const result = await bluetooth.tare();
          showToast(result.message);
        }}
        onToggleStream={async (enabled) => {
          const result = await bluetooth.setStreaming(enabled);
          showToast(result.message);
        }}
        onGoCapture={() => handleSectionChange("capture")}
      />
    );
  } else if (section === "capture") {
    activeScreen = (
        <CaptureScreen
          videoRef={camera.videoRef}
          previewUrl={previewUrl}
        note={mealNote}
        onNoteChange={setMealNote}
        onStartCamera={async () => {
          try {
            await camera.startCamera();
          } catch (error) {
            showToast(error instanceof Error ? error.message : t("toasts.cameraFailed"));
          }
        }}
        onStopCamera={camera.stopCamera}
        onAnalyzeCamera={handleAnalyzeCamera}
        onSelectFile={handleSelectUpload}
        onAnalyzeUpload={handleAnalyzeUpload}
        cameraReady={Boolean(camera.stream)}
        status={analysis.status}
        isConnected={bluetooth.isConnected}
        isDemoMode={bluetooth.isBypassMode}
        measurementStatus={bluetooth.measurementStatus}
          stableWeight={bluetooth.stableWeight}
          latestWeight={bluetooth.latestWeight}
          result={latestResult}
          resultImageUrl={previewUrl ?? latestMeal?.imageDataUrl ?? null}
          analysisError={analysis.analysisError}
          disclaimer={analysis.disclaimer}
          onRetryAnalysis={handleRetryAnalysis}
          navDirection={navDirection}
        />
    );
  } else if (section === "history") {
    activeScreen = (
      <HistoryScreen
        meals={analysis.history}
        navDirection={navDirection}
        onDeleteMeal={analysis.removeMeal}
        onMealRemoved={() => showToast("Meal removed")}
      />
    );
  } else if (section === "profile") {
    activeScreen = profileAuthOpen ? (
      <AuthScreen onAuth={handleAuthSuccess} />
    ) : (
      <ProfileScreen
        profile={profile}
        onChange={setProfile}
        metrics={metrics}
        onOpenDebug={() => setDebugOpen(true)}
        currentUser={currentUser}
        onSignIn={() => setProfileAuthOpen(true)}
        onSignOut={handleSignOut}
        isScaleConnected={bluetooth.isConnected}
        currentScaleWeight={bluetooth.stableWeight || bluetooth.latestWeight}
        currentCalibrationFactor={calibrationFactor}
        onRunCalibrationTare={async () => {
          const result = await bluetooth.tare();
          showToast(result.message);
          return result;
        }}
        onSaveCalibrationFactor={saveCalibrationFactor}
      />
    );
  }

  if (phase === "welcome") {
    return <WelcomeScreen onConnect={connectScale} onContinue={continueWithoutScale} />;
  }

  if (phase === "connect") {
    return (
      <ConnectScreen
        supported={bluetooth.supported}
        bluetoothEnabled={bluetooth.bluetoothEnabled}
        devices={bluetooth.devices}
        scanning={bluetooth.isScanning}
        connecting={bluetooth.isConnecting}
        connectionStatus={bluetooth.connectionStatus}
        permissionBlocked={bluetooth.permissionBlocked}
        noDevicesFound={bluetooth.scanCompletedWithNoDevices}
        lastMessage={bluetooth.lastMessage}
        onGrantPermission={() => {
          void bluetooth.requestPermissions().then((result) => showToast(result.message));
        }}
        onEnableBluetooth={() => {
          void bluetooth.enableBluetooth().then((result) => showToast(result.message));
        }}
        onOpenSettings={() => {
          void bluetooth.openSettings().then((result) => showToast(result.message));
        }}
        onScan={() => {
          void bluetooth.scan().then((result) => showToast(result.message));
        }}
        onConnectDevice={(device) => {
          void handleConnectDevice(device.address);
        }}
        onSkip={continueWithoutScale}
        onCancel={() => setPhase("welcome")}
      />
    );
  }

  return (
    <main dir={dir} className="app-shell">
      <MobileShell
        activeSection={section}
        onChangeSection={handleSectionChange}
        connectionLabel={connectionLabel}
        connectionTone={connectionTone}
        onOpenDebug={() => setDebugOpen(true)}
      >
        {bluetooth.connectionBanner ? (
          <Card className="mb-4 rounded-2xl border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                {bluetooth.isReconnecting ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-700" />
                ) : null}
                <span>{bluetooth.connectionBanner}</span>
              </div>
              {bluetooth.reconnectFailed ? (
                <button
                  onClick={() => {
                    void bluetooth.retryReconnect().then((result) => showToast(result.message));
                  }}
                  className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  Retry
                </button>
              ) : !bluetooth.isReconnecting ? (
                <button
                  onClick={bluetooth.dismissBanner}
                  className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          </Card>
        ) : null}

        {toast ? (
          <Card className="mb-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
            {toast}
          </Card>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreenKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {activeScreen}
          </motion.div>
        </AnimatePresence>

        {debugOpen ? (
          <button
            onClick={() => setDebugOpen(false)}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            {t("common.backToApp")}
          </button>
        ) : null}

        {!debugOpen && latestMeal ? (
          <p className="mt-4 px-1 text-xs leading-5 text-slate-400">
            {t("common.estimatedNutritionDisclaimer")}
          </p>
        ) : null}
      </MobileShell>
    </main>
  );
}
