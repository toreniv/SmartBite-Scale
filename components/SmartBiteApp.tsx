//components/SmartBiteApp.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ChangeEvent } from "react";
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
import { getCurrentUser } from "@/lib/localAuth";
import type { AppPhase, AppSection, NavDirection, User } from "@/lib/types";

const TAB_ORDER: AppSection[] = ["home", "capture", "history", "profile"];

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

  const bluetooth = useBluetoothScale();
  const camera = useCamera();
  const { profile, setProfile, metrics } = useUserProfile();
  const analysis = useMealAnalysis(profile, metrics.dailyCalorieTarget, metrics.proteinTarget);

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
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const measuredWeight = bluetooth.stableWeight || bluetooth.latestWeight || undefined;
  const connectionLabel = bluetooth.isConnected
    ? t(
        bluetooth.deviceName
          ? "common.connectionLabel.connectedTo"
          : "common.connectionLabel.connected",
        { name: bluetooth.deviceName },
      )
    : bluetooth.isBypassMode
      ? t("common.connectionLabel.bypass")
      : t("common.connectionLabel.notConnected");

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

  const latestMeal = analysis.history[0] ?? null;
  const latestResult = analysis.result ?? latestMeal;
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
        measuredWeight={measuredWeight ?? 0}
        disclaimer={analysis.disclaimer}
        recommendations={analysis.recommendations}
        isConnected={bluetooth.isConnected}
        latestWeight={bluetooth.latestWeight}
        stableWeight={bluetooth.stableWeight}
        measurementStatus={bluetooth.measurementStatus}
        navDirection={navDirection}
        onConnectScale={connectScale}
        onTare={async () => {
          const result = await bluetooth.tare();
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
        stableWeight={bluetooth.stableWeight}
        latestWeight={bluetooth.latestWeight}
        result={latestResult}
        disclaimer={analysis.disclaimer}
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
      />
    );
  }

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
    <main dir={dir} className="app-shell">
      <MobileShell
        activeSection={section}
        onChangeSection={handleSectionChange}
        connectionLabel={connectionLabel}
        onOpenDebug={() => setDebugOpen(true)}
      >
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
