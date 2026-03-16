"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  connectScale,
  isBluetoothSupported,
  requestScaleDevice,
  subscribeToWeight,
  writeCommand,
} from "@/lib/bluetooth";
import { parseDeviceMessage, type ParsedDeviceMessage } from "@/lib/deviceMessages";
import type {
  BluetoothCharacteristics,
  BluetoothDeviceLike,
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

type WeightSample = { value: number; timestamp: number };
type DemoPhase = "idle" | "placing" | "settling" | "stable" | "removing";
type DemoState = {
  currentWeight: number;
  targetWeight: number;
  holdTicks: number;
  settleTicks: number;
  phase: DemoPhase;
};

const DEFAULT_MESSAGE =
  "Bluetooth is not supported in this browser. Please use Chrome or Edge on a supported device.";
const DEMO_MESSAGE = "Demo mode active. Simulating scale data.";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createDemoState(): DemoState {
  return {
    currentWeight: 0,
    targetWeight: 0,
    holdTicks: 5,
    settleTicks: 0,
    phase: "idle",
  };
}

export function useBluetoothScale() {
  const deviceRef = useRef<BluetoothDeviceLike | null>(null);
  const characteristicsRef = useRef<BluetoothCharacteristics>({ weight: null, led: null });
  const samplesRef = useRef<WeightSample[]>([]);
  const stableWeightRef = useRef(0);
  const sourceActiveRef = useRef(false);
  const demoIntervalRef = useRef<number | null>(null);
  const demoStateRef = useRef<DemoState>(createDemoState());

  const [supported] = useState(isBluetoothSupported());
  const [initialized, setInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [latestWeight, setLatestWeight] = useState(0);
  const [stableWeight, setStableWeight] = useState(0);
  const [weightSamples, setWeightSamples] = useState<number[]>([]);
  const [measurementStatus, setMeasurementStatus] =
    useState<MeasurementStatus>("disconnected");
  const [selectedLED, setSelectedLED] = useState<LEDColor | "">("");
  const [brightness, setBrightness] = useState(255);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [deviceName, setDeviceName] = useState("");
  const [lastServingEvent, setLastServingEvent] = useState<ServingEvent | null>(null);
  const [lastMessage, setLastMessage] = useState("");

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
        (
          nextSamples.reduce((sum, entry) => sum + entry.value, 0) /
          nextSamples.length
        ).toFixed(1),
      );

      setStableWeight(nextStableWeight);
      setMeasurementStatus("stable");

      if (Math.abs(nextStableWeight - stableWeightRef.current) >= SERVING_EVENT_DELTA_GRAMS) {
        setLastServingEvent({
          detectedAt: Date.now(),
          grams: nextStableWeight,
        });
      }

      stableWeightRef.current = nextStableWeight;
    }
  };

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

        if (message.value === "READY") {
          setMeasurementStatus("idle");
        }

        if (message.value === "STREAM_OFF") {
          setMeasurementStatus(sourceActiveRef.current ? "idle" : "disconnected");
        }

        return;
      case "tare_done":
        resetWeightState(sourceActiveRef.current ? "idle" : "disconnected");
        setLastMessage(message.raw);
        return;
      case "pong":
        setLastMessage(message.raw);
        return;
      case "error":
        setLastMessage(message.raw);
        return;
      case "unknown":
        setLastMessage(message.raw);
        return;
    }
  };

  const scheduleNextDemoTick = () => {
    demoIntervalRef.current = window.setTimeout(() => {
      const nextWeight = nextDemoWeight();
      handleParsedMessage(parseDeviceMessage(`WEIGHT:${nextWeight.toFixed(2)}`));
      scheduleNextDemoTick();
    }, randomBetween(DEMO_TICK_MIN_MS, DEMO_TICK_MAX_MS));
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
      const step = Math.min(
        remaining,
        Math.max(2.5, Math.min(18, remaining * randomBetween(0.12, 0.24))),
      );
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

  const startDemoMode = () => {
    stopDemoMode();
    demoStateRef.current = createDemoState();
    handleParsedMessage(parseDeviceMessage("STATUS:READY"));
    handleParsedMessage(parseDeviceMessage("STATUS:STREAM_ON"));

    scheduleNextDemoTick();
  };

  useEffect(() => {
    sourceActiveRef.current = isConnected || isBypassMode;
  }, [isBypassMode, isConnected]);

  useEffect(() => {
    return () => {
      stopDemoMode();

      if (deviceRef.current?.gatt?.connected && deviceRef.current.gatt.disconnect) {
        deviceRef.current.gatt.disconnect();
      }
    };
  }, []);

  const connect = async () => {
    if (!supported) {
      setLastMessage(DEFAULT_MESSAGE);
      return { success: false, message: DEFAULT_MESSAGE };
    }

    stopDemoMode();
    setIsBypassMode(false);
    resetWeightState("disconnected");
    setIsConnecting(true);
    setLastMessage("");

    try {
      const { device, discoveredDevice } = await requestScaleDevice();
      deviceRef.current = device;
      setDevices([discoveredDevice]);
      setDeviceName(discoveredDevice.name);

      const characteristics = await connectScale(device);
      characteristicsRef.current = characteristics;

      if (characteristics.weight) {
        await subscribeToWeight(characteristics.weight, handleWeightUpdate);
      }

      setInitialized(true);
      setIsConnected(true);
      setIsBypassMode(false);
      resetWeightState("idle");

      await writeCommand(characteristics.led, "TARE");

      const message = "Scale connected successfully.";
      setLastMessage(message);
      return { success: true, message };
    } catch (error) {
      const message =
        error instanceof Error ? `Connection failed: ${error.message}` : "Connection failed.";
      setIsConnected(false);
      setInitialized(false);
      setMeasurementStatus("disconnected");
      setLastMessage(message);
      return { success: false, message };
    } finally {
      setIsConnecting(false);
    }
  };

  const enableBypassMode = () => {
    if (deviceRef.current?.gatt?.connected && deviceRef.current.gatt.disconnect) {
      deviceRef.current.gatt.disconnect();
    }

    deviceRef.current = null;
    characteristicsRef.current = { weight: null, led: null };
    setDevices([]);
    setDeviceName("");
    setInitialized(true);
    setIsBypassMode(true);
    setIsConnected(false);
    setLastMessage(DEMO_MESSAGE);
    resetWeightState("idle");
    startDemoMode();
  };

  const disconnect = () => {
    stopDemoMode();

    if (deviceRef.current?.gatt?.connected && deviceRef.current.gatt.disconnect) {
      deviceRef.current.gatt.disconnect();
    }

    deviceRef.current = null;
    characteristicsRef.current = { weight: null, led: null };
    samplesRef.current = [];
    stableWeightRef.current = 0;
    setIsConnected(false);
    setLatestWeight(0);
    setStableWeight(0);
    setWeightSamples([]);
    setDevices([]);
    setDeviceName("");
    setInitialized(false);
    setIsBypassMode(false);
    setMeasurementStatus("disconnected");
    setSelectedLED("");
    setLastServingEvent(null);
    setLastMessage("");
  };

  const tare = async () => {
    if (isBypassMode) {
      demoStateRef.current = createDemoState();
      handleParsedMessage(parseDeviceMessage("TARE_DONE"));
      return { success: true, message: "Scale tared and ready." };
    }

    const success = await writeCommand(characteristicsRef.current.led, "TARE");

    if (!success) {
      return { success: false, message: "Connect the scale before calibrating." };
    }

    resetWeightState("idle");
    return { success: true, message: "Scale tared and ready." };
  };

  const sendLedCommand = async (color: LEDColor) => {
    const success = await writeCommand(characteristicsRef.current.led, color);

    if (!success) {
      return { success: false, message: "Failed to control LED." };
    }

    setSelectedLED(color);
    return { success: true, message: `${color} command sent.` };
  };

  const updateBrightness = async (value: number) => {
    setBrightness(value);
    await writeCommand(characteristicsRef.current.led, "BRIGHTNESS", value);
  };

  const state: BluetoothState = useMemo(
    () => ({
      supported,
      initialized,
      isConnecting,
      isConnected,
      isBypassMode,
      connectionLabel: isConnected
        ? `Connected${deviceName ? ` to ${deviceName}` : ""}`
        : isBypassMode
          ? "Demo mode"
          : "Not connected",
      latestWeight,
      stableWeight,
      weightSamples,
      measurementStatus,
      selectedLED,
      brightness,
      devices,
      deviceName,
      lastServingEvent,
    }),
    [
      brightness,
      deviceName,
      devices,
      initialized,
      isBypassMode,
      isConnected,
      isConnecting,
      lastServingEvent,
      latestWeight,
      measurementStatus,
      selectedLED,
      stableWeight,
      supported,
      weightSamples,
    ],
  );

  return {
    ...state,
    connect,
    disconnect,
    enableBypassMode,
    lastMessage,
    sendLedCommand,
    tare,
    updateBrightness,
  };
}
