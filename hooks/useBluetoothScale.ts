"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  connectBluetoothClassicDevice,
  disconnectBluetoothClassicDevice,
  getBluetoothClassicStatus,
  getBluetoothClassicUnavailableMessage,
  isBluetoothClassicSupported,
  openBluetoothClassicAppSettings,
  requestBluetoothClassicPermissions,
  requestEnableBluetoothClassic,
  scanBluetoothClassicDevices,
  sendBluetoothClassicCommand,
  subscribeToBluetoothClassicConnectionState,
  subscribeToBluetoothClassicMessages,
} from "@/lib/bluetoothClassic.service";
import { parseDeviceMessage, type ParsedDeviceMessage } from "@/lib/deviceMessages";
import type {
  BluetoothConnectionStatus,
  BluetoothPermissionStatus,
  BluetoothState,
  DiscoveredDevice,
  LEDColor,
  MeasurementStatus,
  ServingEvent,
} from "@/lib/types";

const STABLE_SAMPLE_COUNT = 5;
const STABLE_DELTA_GRAMS = 1.5;
const SERVING_EVENT_DELTA_GRAMS = 10;
const DEMO_TICK_MIN_MS = 400;
const DEMO_TICK_MAX_MS = 700;
const RECONNECT_MAX_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;
const PING_TIMEOUT_MS = 2500;
const TARE_TIMEOUT_MS = 4000;
const DEFAULT_PERMISSIONS: BluetoothPermissionStatus = {
  scan: "unknown",
  connect: "unknown",
  location: "unknown",
};

type WeightSample = { value: number; timestamp: number };
type DemoPhase = "idle" | "placing" | "settling" | "stable" | "removing";
type DemoState = {
  currentWeight: number;
  targetWeight: number;
  holdTicks: number;
  settleTicks: number;
  phase: DemoPhase;
};
type PendingWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

const DEMO_MESSAGE = "Demo mode active. Simulating scale data.";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createDemoState(): DemoState {
  return { currentWeight: 0, targetWeight: 0, holdTicks: 5, settleTicks: 0, phase: "idle" };
}

function hasGrantedPermissions(permissions: BluetoothPermissionStatus) {
  return (
    permissions.location === "granted" ||
    (permissions.scan === "granted" && permissions.connect === "granted")
  );
}

function mergeDevices(current: DiscoveredDevice[], nextDevice: DiscoveredDevice) {
  const next = current.filter((device) => device.address !== nextDevice.address);
  next.push(nextDevice);
  return next.sort((left, right) => {
    if (left.isHc06 !== right.isHc06) {
      return left.isHc06 ? -1 : 1;
    }
    if (left.isPaired !== right.isPaired) {
      return left.isPaired ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
}

function getReconnectBanner(attempt: number) {
  if (attempt <= 1) {
    return "Scale disconnected \u2014 reconnecting\u2026";
  }
  if (attempt === 2) {
    return "Still trying to reconnect\u2026 (2/3)";
  }
  return "Last attempt\u2026 (3/3)";
}

export function useBluetoothScale() {
  const samplesRef = useRef<WeightSample[]>([]);
  const stableWeightRef = useRef(0);
  const sourceActiveRef = useRef(false);
  const demoIntervalRef = useRef<number | null>(null);
  const demoStateRef = useRef<DemoState>(createDemoState());
  const demoLockedWeightRef = useRef<number | null>(null);
  const connectedDeviceRef = useRef<DiscoveredDevice | null>(null);
  const disconnectRequestedRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingPongRef = useRef<PendingWaiter | null>(null);
  const pendingTareRef = useRef<PendingWaiter | null>(null);

  const [supported] = useState(isBluetoothClassicSupported());
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [permissions, setPermissions] = useState<BluetoothPermissionStatus>(DEFAULT_PERMISSIONS);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompletedWithNoDevices, setScanCompletedWithNoDevices] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);
  const [isStreamEnabled, setIsStreamEnabled] = useState(false);
  const [hasConfirmedPong, setHasConfirmedPong] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<BluetoothConnectionStatus>("idle");
  const [connectionBanner, setConnectionBanner] = useState("");
  const [latestWeight, setLatestWeight] = useState(0);
  const [stableWeight, setStableWeight] = useState(0);
  const [weightSamples, setWeightSamples] = useState<number[]>([]);
  const [measurementStatus, setMeasurementStatus] = useState<MeasurementStatus>("disconnected");
  const [selectedLED] = useState<LEDColor | "">("");
  const [brightness] = useState(255);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [deviceName, setDeviceName] = useState("");
  const [lastServingEvent, setLastServingEvent] = useState<ServingEvent | null>(null);
  const [lastMessage, setLastMessage] = useState("");

  const clearPendingWaiter = (waiterRef: MutableRefObject<PendingWaiter | null>, message: string) => {
    if (!waiterRef.current) {
      return;
    }
    window.clearTimeout(waiterRef.current.timeoutId);
    waiterRef.current.reject(new Error(message));
    waiterRef.current = null;
  };

  const resetWeightState = (status: MeasurementStatus) => {
    samplesRef.current = [];
    stableWeightRef.current = 0;
    setLatestWeight(0);
    setStableWeight(0);
    setWeightSamples([]);
    setMeasurementStatus(status);
  };

  const stopDemoMode = () => {
    if (demoIntervalRef.current !== null) {
      window.clearTimeout(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    demoStateRef.current = createDemoState();
  };

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const resetDisconnectedState = (message = "") => {
    resetWeightState("disconnected");
    setIsConnected(false);
    setIsConnecting(false);
    setInitialized(false);
    setIsReconnecting(false);
    setHasConfirmedPong(false);
    setIsStreamEnabled(false);
    setDeviceName("");
    setLastServingEvent(null);
    if (!isBypassMode) {
      setLastMessage(message);
    }
  };

  const handleWeightUpdate = (value: number) => {
    const normalized = Number(value.toFixed(1));
    const sample = { value: normalized, timestamp: Date.now() };
    const nextSamples = [...samplesRef.current, sample].slice(-STABLE_SAMPLE_COUNT);
    samplesRef.current = nextSamples;
    setLatestWeight(normalized);
    setWeightSamples(nextSamples.map((entry) => entry.value));
    if (normalized <= 0.5) {
      setMeasurementStatus(sourceActiveRef.current ? "idle" : "disconnected");
      return;
    }
    setMeasurementStatus("measuring");
    if (nextSamples.length < STABLE_SAMPLE_COUNT) {
      return;
    }
    const min = Math.min(...nextSamples.map((entry) => entry.value));
    const max = Math.max(...nextSamples.map((entry) => entry.value));
    if (max - min <= STABLE_DELTA_GRAMS) {
      const nextStableWeight = Number(
        (nextSamples.reduce((sum, entry) => sum + entry.value, 0) / nextSamples.length).toFixed(1),
      );
      setStableWeight(nextStableWeight);
      setMeasurementStatus("stable");
      if (Math.abs(nextStableWeight - stableWeightRef.current) >= SERVING_EVENT_DELTA_GRAMS) {
        setLastServingEvent({ detectedAt: Date.now(), grams: nextStableWeight });
      }
      stableWeightRef.current = nextStableWeight;
    }
  };

  const createPendingWaiter = (
    waiterRef: MutableRefObject<PendingWaiter | null>,
    timeoutMs: number,
    timeoutMessage: string,
  ) =>
    new Promise<void>((resolve, reject) => {
      clearPendingWaiter(waiterRef, timeoutMessage);
      const timeoutId = window.setTimeout(() => {
        waiterRef.current = null;
        reject(new Error(timeoutMessage));
      }, timeoutMs);
      waiterRef.current = {
        resolve: () => {
          window.clearTimeout(timeoutId);
          waiterRef.current = null;
          resolve();
        },
        reject: (error) => {
          window.clearTimeout(timeoutId);
          waiterRef.current = null;
          reject(error);
        },
        timeoutId,
      };
    });

  const handleParsedMessage = (message: ParsedDeviceMessage | null) => {
    if (!message) {
      return;
    }
    switch (message.type) {
      case "weight":
        handleWeightUpdate(message.value);
        return;
      case "status":
        setLastMessage(message.raw);
        if (message.value === "READY" || message.value === "STREAM_ON") {
          setIsStreamEnabled(true);
          setMeasurementStatus("idle");
        }
        if (message.value === "STREAM_OFF") {
          setIsStreamEnabled(false);
          setMeasurementStatus(sourceActiveRef.current ? "idle" : "disconnected");
        }
        return;
      case "tare_done":
        resetWeightState(sourceActiveRef.current ? "idle" : "disconnected");
        setLastMessage(message.raw);
        pendingTareRef.current?.resolve();
        return;
      case "pong":
        setHasConfirmedPong(true);
        setLastMessage(message.raw);
        pendingPongRef.current?.resolve();
        return;
      case "error":
      case "unknown":
        setLastMessage(message.raw);
        return;
    }
  };

  const nextDemoWeight = () => {
    const state = demoStateRef.current;
    if (state.phase === "idle") {
      state.holdTicks -= 1;
      if (state.holdTicks <= 0) {
        state.phase = "placing";
        state.targetWeight = randomBetween(90, 380);
        state.settleTicks = Math.floor(randomBetween(4, 8));
      }
      state.currentWeight = 0;
      return Math.max(0, randomBetween(-0.2, 0.8));
    }
    if (state.phase === "placing") {
      const remaining = Math.max(0, state.targetWeight - state.currentWeight);
      const step = Math.min(remaining, Math.max(2.5, Math.min(18, remaining * randomBetween(0.12, 0.24))));
      state.currentWeight = Math.min(state.targetWeight, state.currentWeight + step);
      if (remaining <= 6) {
        state.phase = "settling";
      }
      return state.currentWeight + randomBetween(-0.9, 1.6);
    }
    if (state.phase === "settling") {
      state.settleTicks -= 1;
      const diff = state.targetWeight - state.currentWeight;
      state.currentWeight += diff * randomBetween(0.35, 0.65);
      if (state.settleTicks <= 0 || Math.abs(diff) <= 0.8) {
        state.phase = "stable";
        state.currentWeight = state.targetWeight;
        state.holdTicks = Math.floor(randomBetween(7, 14));
      }
      return state.currentWeight + randomBetween(-1.1, 1.1);
    }
    if (state.phase === "stable") {
      state.holdTicks -= 1;
      if (state.holdTicks <= 0) {
        state.phase = "removing";
      }
      state.currentWeight = state.targetWeight;
      return state.targetWeight + randomBetween(-0.35, 0.35);
    }
    const step = randomBetween(5, 16);
    state.currentWeight = Math.max(0, state.currentWeight - step);
    if (state.currentWeight <= 0.5) {
      state.phase = "idle";
      state.currentWeight = 0;
      state.targetWeight = 0;
      state.settleTicks = 0;
      state.holdTicks = Math.floor(randomBetween(4, 8));
    }
    return Math.max(0, state.currentWeight + randomBetween(-0.5, 0.5));
  };

  const scheduleNextDemoTick = () => {
    if (demoLockedWeightRef.current !== null) {
      return;
    }
    demoIntervalRef.current = window.setTimeout(() => {
      const nextWeight = nextDemoWeight();
      handleParsedMessage(parseDeviceMessage(`WEIGHT:${nextWeight.toFixed(2)}`));
      scheduleNextDemoTick();
    }, randomBetween(DEMO_TICK_MIN_MS, DEMO_TICK_MAX_MS));
  };

  const startDemoMode = () => {
    stopDemoMode();
    demoLockedWeightRef.current = null;
    demoStateRef.current = createDemoState();
    handleParsedMessage(parseDeviceMessage("STATUS:READY"));
    handleParsedMessage(parseDeviceMessage("STATUS:STREAM_ON"));
    scheduleNextDemoTick();
  };

  const lockDemoWeight = (value: number) => {
    if (!isBypassMode) {
      return;
    }
    const normalized = Number(value.toFixed(1));
    demoLockedWeightRef.current = normalized;
    stopDemoMode();
    samplesRef.current = Array.from({ length: STABLE_SAMPLE_COUNT }, () => ({
      value: normalized,
      timestamp: Date.now(),
    }));
    stableWeightRef.current = normalized;
    setWeightSamples(samplesRef.current.map((entry) => entry.value));
    setLatestWeight(normalized);
    setStableWeight(normalized);
    setMeasurementStatus("stable");
  };

  const refreshAvailability = async () => {
    if (!supported) {
      return;
    }
    try {
      const status = await getBluetoothClassicStatus();
      setBluetoothEnabled(status.enabled);
      setPermissions(status.permissions);
      setPermissionBlocked(Boolean(status.permissionBlocked));
    } catch (error) {
      setConnectionStatus("error");
      setLastMessage(error instanceof Error ? error.message : "Unable to read Bluetooth status.");
    }
  };

  const requestPermissions = async () => {
    if (!supported) {
      const message = getBluetoothClassicUnavailableMessage();
      setLastMessage(message);
      return { success: false, message };
    }
    try {
      const status = await requestBluetoothClassicPermissions();
      setPermissions(status.permissions);
      setBluetoothEnabled(status.enabled);
      setPermissionBlocked(Boolean(status.permissionBlocked));
      if (!hasGrantedPermissions(status.permissions)) {
        const blocked = Boolean(status.permissionBlocked);
        const message = blocked
          ? "Permission blocked. Open Android settings to enable Bluetooth access for SmartBite."
          : "Bluetooth permission required. SmartBite needs Bluetooth access to connect to your scale.";
        setConnectionStatus("permissions-denied");
        setLastMessage(message);
        return { success: false, message };
      }
      setConnectionStatus("idle");
      return { success: true, message: "Bluetooth permissions granted." };
    } catch (error) {
      const latestStatus = await getBluetoothClassicStatus().catch(() => null);
      const blocked = Boolean(latestStatus?.permissionBlocked);
      if (latestStatus) {
        setPermissions(latestStatus.permissions);
        setBluetoothEnabled(latestStatus.enabled);
        setPermissionBlocked(blocked);
      }
      const message = blocked
        ? "Permission blocked. Open Android settings to enable Bluetooth access for SmartBite."
        : error instanceof Error
          ? error.message
          : "Bluetooth permission required. SmartBite needs Bluetooth access to connect to your scale.";
      setConnectionStatus("permissions-denied");
      setLastMessage(message);
      return { success: false, message };
    }
  };

  const openSettings = async () => {
    if (!supported) {
      const message = getBluetoothClassicUnavailableMessage();
      setLastMessage(message);
      return { success: false, message };
    }
    try {
      await openBluetoothClassicAppSettings();
      const message = "Opened Android settings for SmartBite.";
      setLastMessage(message);
      return { success: true, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open Android settings.";
      setLastMessage(message);
      return { success: false, message };
    }
  };

  const enableBluetooth = async () => {
    if (!supported) {
      const message = getBluetoothClassicUnavailableMessage();
      setLastMessage(message);
      return { success: false, message };
    }
    try {
      const result = await requestEnableBluetoothClassic();
      await refreshAvailability();
      if (!result.enabled) {
        const message = "Bluetooth is off. Enable Bluetooth to connect to your scale.";
        setConnectionStatus("bluetooth-disabled");
        setLastMessage(message);
        return { success: false, message };
      }
      const message = "Bluetooth is enabled.";
      setConnectionStatus("idle");
      setLastMessage(message);
      return { success: true, message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Bluetooth is off. Enable Bluetooth to connect to your scale.";
      setConnectionStatus("bluetooth-disabled");
      setLastMessage(message);
      return { success: false, message };
    }
  };

  const waitForPong = () =>
    createPendingWaiter(pendingPongRef, PING_TIMEOUT_MS, "Scale connected, but no PONG response was received from the Arduino.");
  const waitForTareDone = () =>
    createPendingWaiter(pendingTareRef, TARE_TIMEOUT_MS, "The scale did not confirm tare completion.");

  const sendPingAndWait = async () => {
    setHasConfirmedPong(false);
    const waiter = waitForPong();
    const sent = await sendBluetoothClassicCommand("PING");
    if (!sent) {
      clearPendingWaiter(pendingPongRef, "Scale is not connected.");
      throw new Error("Failed to send PING to the scale.");
    }
    await waiter;
  };

  const performDisconnect = async (preserveBanner = false) => {
    clearReconnectTimer();
    clearPendingWaiter(pendingPongRef, "Bluetooth connection closed.");
    clearPendingWaiter(pendingTareRef, "Bluetooth connection closed.");
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    setIsConnecting(false);
    setIsReconnecting(false);
    setReconnectFailed(false);
    setHasConfirmedPong(false);
    setIsStreamEnabled(false);
    if (!preserveBanner) {
      setConnectionBanner("");
    }
    await disconnectBluetoothClassicDevice();
    resetDisconnectedState("");
  };

  const establishConnection = async (device: DiscoveredDevice, options?: { reconnecting?: boolean }) => {
    const reconnecting = Boolean(options?.reconnecting);
    disconnectRequestedRef.current = false;
    clearReconnectTimer();
    stopDemoMode();
    setIsBypassMode(false);
    setIsConnecting(!reconnecting);
    setIsReconnecting(reconnecting);
    setReconnectFailed(false);
    setConnectionStatus(reconnecting ? "reconnecting" : "connecting");
    setDeviceName(device.name);
    setLastMessage(reconnecting ? `Reconnecting to ${device.name}...` : `Connecting to ${device.name}...`);
    const connectedDevice = await connectBluetoothClassicDevice(device);
    connectedDeviceRef.current = connectedDevice;
    setDevices((current) => mergeDevices(current, connectedDevice));
    setDeviceName(connectedDevice.name);
    setInitialized(true);
    setIsConnected(true);
    resetWeightState("idle");
    const streamStarted = await sendBluetoothClassicCommand("STREAM_ON");
    if (!streamStarted) {
      throw new Error("Connected to the scale, but failed to start the weight stream.");
    }
    await sendBluetoothClassicCommand("STATUS");
    await sendPingAndWait();
    setConnectionStatus("connected");
    setIsConnecting(false);
    setIsReconnecting(false);
    setReconnectFailed(false);
    setHasConfirmedPong(true);
    setIsStreamEnabled(true);
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    setConnectionBanner("");
    setLastMessage(`Connected to ${connectedDevice.name}. PONG received.`);
    return connectedDevice;
  };

  const failDisconnectedState = (message: string, preserveRetry = false) => {
    setConnectionStatus("error");
    setReconnectFailed(preserveRetry);
    setConnectionBanner(
      preserveRetry
        ? "Scale disconnected. Tap to retry."
        : "Scale disconnected. Live grams are unavailable, so the app has fallen back to image-only estimates.",
    );
    resetDisconnectedState(message);
  };

  const scheduleReconnect = (reason: string) => {
    if (disconnectRequestedRef.current) {
      connectedDeviceRef.current = null;
      setConnectionBanner("");
      setReconnectFailed(false);
      resetDisconnectedState(reason);
      setConnectionStatus("idle");
      return;
    }
    if (isBypassMode) {
      failDisconnectedState(reason);
      return;
    }
    const targetDevice = connectedDeviceRef.current;
    if (!targetDevice) {
      failDisconnectedState(reason);
      return;
    }
    if (reconnectTimeoutRef.current !== null) {
      return;
    }
    if (reconnectAttemptsRef.current >= RECONNECT_MAX_ATTEMPTS) {
      failDisconnectedState(reason, true);
      return;
    }
    reconnectAttemptsRef.current += 1;
    setReconnectAttempts(reconnectAttemptsRef.current);
    setIsConnected(false);
    setIsConnecting(false);
    setIsReconnecting(true);
    setReconnectFailed(false);
    setHasConfirmedPong(false);
    setIsStreamEnabled(false);
    setConnectionStatus("reconnecting");
    setMeasurementStatus("disconnected");
    setConnectionBanner(getReconnectBanner(reconnectAttemptsRef.current));
    setLastMessage(reason);
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      void establishConnection(targetDevice, { reconnecting: true }).catch((error) => {
        scheduleReconnect(error instanceof Error ? error.message : "Bluetooth reconnection failed.");
      });
    }, RECONNECT_DELAY_MS);
  };

  const retryReconnect = async () => {
    if (!connectedDeviceRef.current) {
      const message = "No previously connected scale is available to retry.";
      setLastMessage(message);
      return { success: false, message };
    }
    disconnectRequestedRef.current = false;
    clearReconnectTimer();
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    setReconnectFailed(false);
    scheduleReconnect("Retrying Bluetooth connection.");
    return { success: true, message: "Retrying Bluetooth connection." };
  };

  const scan = async () => {
    if (!supported) {
      const message = getBluetoothClassicUnavailableMessage();
      setLastMessage(message);
      return { success: false, message };
    }
    stopDemoMode();
    setIsBypassMode(false);
    setIsScanning(true);
    setScanCompletedWithNoDevices(false);
    setReconnectFailed(false);
    setConnectionStatus("scanning");
    setDevices([]);
    setLastMessage("");
    const permissionResult = await requestPermissions();
    if (!permissionResult.success) {
      setIsScanning(false);
      return permissionResult;
    }
    const status = await getBluetoothClassicStatus();
    setBluetoothEnabled(status.enabled);
    setPermissionBlocked(Boolean(status.permissionBlocked));
    if (!status.enabled) {
      const message = "Bluetooth is off. Enable Bluetooth to connect to your scale.";
      setConnectionStatus("bluetooth-disabled");
      setLastMessage(message);
      setIsScanning(false);
      return { success: false, message };
    }
    try {
      const scannedDevices = await scanBluetoothClassicDevices({
        onDevicesChanged: (nextDevices) => setDevices(nextDevices),
      });
      setDevices(scannedDevices);
      setScanCompletedWithNoDevices(scannedDevices.length === 0);
      setConnectionStatus("idle");
      const message = scannedDevices.length
        ? "Select a Bluetooth Classic device to connect."
        : "No devices found. Make sure your HC-06 is powered on and paired with this phone.";
      setLastMessage(message);
      return { success: true, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bluetooth scan failed. Please try again.";
      setConnectionStatus("error");
      setLastMessage(message);
      return { success: false, message };
    } finally {
      setIsScanning(false);
    }
  };

  const connect = async () => scan();

  const connectDevice = async (device: DiscoveredDevice) => {
    if (!supported) {
      const message = getBluetoothClassicUnavailableMessage();
      setLastMessage(message);
      return { success: false, message };
    }
    try {
      await establishConnection(device);
      return { success: true, message: `Connected to ${device.name}.` };
    } catch (error) {
      await disconnectBluetoothClassicDevice();
      connectedDeviceRef.current = null;
      setReconnectFailed(false);
      resetDisconnectedState(error instanceof Error ? error.message : "Bluetooth connection failed.");
      setConnectionStatus("error");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Bluetooth connection failed.",
      };
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    sourceActiveRef.current = isConnected || isBypassMode;
  }, [isBypassMode, isConnected]);

  useEffect(() => {
    void refreshAvailability();
    let cancelled = false;
    async function subscribe() {
      if (!supported) {
        return;
      }
      const messageHandle = await subscribeToBluetoothClassicMessages((line) => {
        if (!cancelled) {
          handleParsedMessage(parseDeviceMessage(line));
        }
      });
      const stateHandle = await subscribeToBluetoothClassicConnectionState((event) => {
        if (cancelled) {
          return;
        }
        if (event.device?.name) {
          setDeviceName(event.device.name);
        }
        if (event.status === "connecting" && reconnectTimeoutRef.current === null) {
          setIsConnecting(true);
          setConnectionStatus("connecting");
        }
        if (event.status === "connected") {
          setInitialized(true);
          setIsConnected(true);
          return;
        }
        if (event.status === "disconnected") {
          scheduleReconnect(event.message ?? "Disconnected from the scale.");
          return;
        }
        if (event.status === "error") {
          scheduleReconnect(event.message ?? "Bluetooth connection error.");
        }
      });
      return () => {
        void messageHandle.remove();
        void stateHandle.remove();
      };
    }
    let cleanup: (() => void) | undefined;
    void subscribe().then((removeListeners) => {
      cleanup = removeListeners;
    });
    return () => {
      cancelled = true;
      cleanup?.();
      clearReconnectTimer();
      stopDemoMode();
      disconnectRequestedRef.current = true;
      void disconnectBluetoothClassicDevice();
    };
  }, [supported]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAvailability();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [supported]);

  const enableBypassMode = () => {
    disconnectRequestedRef.current = true;
    void disconnectBluetoothClassicDevice();
    clearReconnectTimer();
    connectedDeviceRef.current = null;
    stopDemoMode();
    setDevices([]);
    setDeviceName("");
    setInitialized(true);
    setIsBypassMode(true);
    setIsConnected(false);
    setIsConnecting(false);
    setIsScanning(false);
    setIsReconnecting(false);
    setReconnectFailed(false);
    setIsStreamEnabled(true);
    setHasConfirmedPong(false);
    setConnectionStatus("idle");
    setConnectionBanner("");
    setLastMessage(DEMO_MESSAGE);
    resetWeightState("idle");
    startDemoMode();
  };

  const disconnect = async () => {
    disconnectRequestedRef.current = true;
    stopDemoMode();
    clearReconnectTimer();
    try {
      if (isConnected) {
        await sendBluetoothClassicCommand("STREAM_OFF");
      }
    } catch {
      // Ignore cleanup failures and close the socket anyway.
    }
    connectedDeviceRef.current = null;
    await performDisconnect();
    setDevices([]);
    setIsScanning(false);
    setScanCompletedWithNoDevices(false);
    setIsBypassMode(false);
    setConnectionStatus("idle");
  };

  const tare = async () => {
    if (isBypassMode) {
      demoLockedWeightRef.current = null;
      stopDemoMode();
      demoStateRef.current = createDemoState();
      handleParsedMessage(parseDeviceMessage("TARE_DONE"));
      startDemoMode();
      return { success: true, message: "Scale tared and ready." };
    }
    if (!isConnected) {
      return { success: false, message: "Connect the scale before calibrating." };
    }
    const waiter = waitForTareDone();
    const success = await sendBluetoothClassicCommand("TARE");
    if (!success) {
      clearPendingWaiter(pendingTareRef, "Failed to send TARE.");
      return { success: false, message: "Failed to send tare command." };
    }
    try {
      await waiter;
      return { success: true, message: "Scale tared and ready." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "The scale did not confirm tare.",
      };
    }
  };

  const setStreaming = async (enabled: boolean) => {
    if (!isConnected) {
      return { success: false, message: "Connect the scale before controlling the stream." };
    }
    const success = await sendBluetoothClassicCommand(enabled ? "STREAM_ON" : "STREAM_OFF");
    if (!success) {
      return { success: false, message: "Failed to update the weight stream." };
    }
    setIsStreamEnabled(enabled);
    setLastMessage(enabled ? "STATUS:STREAM_ON" : "STATUS:STREAM_OFF");
    return {
      success: true,
      message: enabled ? "Live weight stream started." : "Live weight stream paused.",
    };
  };

  const dismissBanner = () => setConnectionBanner("");

  const state: BluetoothState = useMemo(
    () => ({
      supported,
      bluetoothEnabled,
      initialized,
      isScanning,
      isConnecting,
      isConnected,
      isBypassMode,
      isReconnecting,
      isStreamEnabled,
      hasConfirmedPong,
      reconnectAttempts,
      connectionStatus,
      connectionLabel: isConnected
        ? hasConfirmedPong
          ? `Connected${deviceName ? ` to ${deviceName}` : ""}`
          : `Checking ${deviceName || "scale"} link`
        : isReconnecting
          ? "Reconnecting..."
          : isBypassMode
            ? "Demo mode"
            : isScanning
              ? "Scanning"
              : !bluetoothEnabled && supported
                ? "Bluetooth off"
                : "Not connected",
      connectionBanner,
      permissionBlocked,
      scanCompletedWithNoDevices,
      reconnectFailed,
      latestWeight,
      stableWeight,
      weightSamples,
      measurementStatus,
      selectedLED,
      brightness,
      devices,
      deviceName,
      lastServingEvent,
      permissions,
    }),
    [
      bluetoothEnabled,
      brightness,
      connectionBanner,
      connectionStatus,
      deviceName,
      devices,
      hasConfirmedPong,
      initialized,
      isBypassMode,
      isConnected,
      isConnecting,
      isReconnecting,
      isScanning,
      isStreamEnabled,
      lastServingEvent,
      latestWeight,
      measurementStatus,
      permissionBlocked,
      permissions,
      reconnectAttempts,
      reconnectFailed,
      scanCompletedWithNoDevices,
      selectedLED,
      stableWeight,
      supported,
      weightSamples,
    ],
  );

  return {
    ...state,
    connect,
    connectDevice,
    disconnect,
    dismissBanner,
    enableBluetooth,
    enableBypassMode,
    lastMessage,
    lockDemoWeight,
    openSettings,
    requestPermissions,
    retryReconnect,
    scan,
    setStreaming,
    tare,
  };
}
