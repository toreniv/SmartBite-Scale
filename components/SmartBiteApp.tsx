"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Modal } from "@/components/Modal";
import { useBluetoothScale } from "@/hooks/useBluetoothScale";
import { useCamera } from "@/hooks/useCamera";
import { INITIAL_SCREEN } from "@/lib/constants";
import type { LEDColor, Screen } from "@/lib/types";
import { CameraScreen } from "@/screens/CameraScreen";
import { DebugScreen } from "@/screens/DebugScreen";
import { DeviceScanScreen } from "@/screens/DeviceScanScreen";
import { MenuScreen } from "@/screens/MenuScreen";
import { UploadScreen } from "@/screens/UploadScreen";
import { WelcomeScreen } from "@/screens/WelcomeScreen";

function getPlatformLabel() {
  if (typeof navigator === "undefined") {
    return "Unknown";
  }

  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    return "iOS Web";
  }

  if (/android/i.test(navigator.userAgent)) {
    return "Android Web";
  }

  return "Web";
}

export function SmartBiteApp() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN);
  const [modalMessage, setModalMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const bluetooth = useBluetoothScale();
  const camera = useCamera();

  const platform = useMemo(() => getPlatformLabel(), []);

  useEffect(() => {
    if (screen !== "camera") {
      camera.stopCamera();
    }
  }, [camera, screen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const showMessage = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage("");
  };

  const handleConnectFlow = async () => {
    setScreen("device-scan");
    const result = await bluetooth.connect();

    showMessage(result.message);

    if (result.success) {
      setScreen("menu");
    }
  };

  const handleContinueWithoutScale = () => {
    bluetooth.enableBypassMode();
    setScreen("menu");
  };

  const handleOpenCamera = async () => {
    try {
      await camera.startCamera();
      setScreen("camera");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Failed to access the camera.");
    }
  };

  const handleAnalyze = async () => {
    try {
      showMessage("Analyzing image...");
      await camera.capturePhoto();
      window.setTimeout(() => {
        setModalMessage("Analysis complete!");
      }, 1200);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Image capture failed.");
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage("Please select a file first.");
      return;
    }

    setUploading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
      showMessage("Image uploaded successfully! Analyzing...");
      window.setTimeout(() => {
        setScreen("menu");
        setUploading(false);
      }, 1400);
    } catch {
      setUploading(false);
      showMessage("Upload failed. Please try again.");
    }
  };

  const handleCalibrate = async () => {
    const result = await bluetooth.tare();
    showMessage(result.message);
  };

  const handleTestCamera = async () => {
    try {
      await camera.startCamera();
      camera.stopCamera();
      showMessage("Camera test succeeded.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Camera test failed.");
    }
  };

  const handleTestBleScan = async () => {
    const result = await bluetooth.connect();
    showMessage(result.message);
  };

  const handleLedCommand = async (color: LEDColor) => {
    const result = await bluetooth.sendLedCommand(color);
    showMessage(result.message);
  };

  const handleLeaveUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setSelectedFile(null);
    setScreen("menu");
  };

  return (
    <main className="app-shell">
      {screen === "welcome" ? (
        <WelcomeScreen
          scanning={bluetooth.isConnecting}
          onConnect={handleConnectFlow}
          onContinueWithoutScale={handleContinueWithoutScale}
          onOpenDebug={() => setScreen("debug")}
        />
      ) : null}

      {screen === "device-scan" ? (
        <DeviceScanScreen
          devices={bluetooth.devices}
          scanning={bluetooth.isConnecting}
          onSkip={handleContinueWithoutScale}
          onCancel={() => {
            bluetooth.cancelConnection();
            setScreen("welcome");
          }}
        />
      ) : null}

      {screen === "menu" ? (
        <MenuScreen
          isBypassMode={!bluetooth.isConnected}
          onScanFood={handleOpenCamera}
          onUploadImage={() => setScreen("upload")}
          onCalibrate={handleCalibrate}
          onMoreOptions={() => setScreen("debug")}
          onBackToMainMenu={() => {
            camera.stopCamera();
            setScreen("welcome");
          }}
        />
      ) : null}

      {screen === "camera" ? (
        <CameraScreen
          videoRef={camera.videoRef}
          weight={bluetooth.weight}
          onAnalyze={handleAnalyze}
          onBack={() => {
            camera.stopCamera();
            setScreen("menu");
          }}
        />
      ) : null}

      {screen === "upload" ? (
        <UploadScreen
          previewUrl={previewUrl}
          uploading={uploading}
          weight={bluetooth.weight}
          showWeight={bluetooth.isConnected && bluetooth.weight > 0}
          onSelectFile={handleFileSelect}
          onUpload={handleUpload}
          onBack={handleLeaveUpload}
        />
      ) : null}

      {screen === "debug" ? (
        <DebugScreen
          bleInitialized={bluetooth.bleInitialized}
          brightness={bluetooth.brightness}
          cameraPermission={camera.permission}
          currentWeight={bluetooth.weight}
          deviceConnected={bluetooth.isConnected}
          isNative={false}
          platform={platform}
          selectedLED={bluetooth.selectedLED}
          onBack={() => setScreen("menu")}
          onBrightnessChange={(value) => void bluetooth.updateBrightness(value)}
          onLedCommand={(color) => void handleLedCommand(color)}
          onTestBleScan={handleTestBleScan}
          onTestCamera={handleTestCamera}
        />
      ) : null}

      {modalMessage ? <Modal message={modalMessage} onClose={closeModal} /> : null}
    </main>
  );
}
