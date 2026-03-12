"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  connectScale,
  isBluetoothSupported,
  requestScaleDevice,
  subscribeToWeight,
  writeCommand,
} from "@/lib/bluetooth";
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

type WeightSample = { value: number; timestamp: number };

const DEFAULT_MESSAGE =
  "Bluetooth is not supported in this browser. Please use Chrome or Edge on a supported device.";

export function useBluetoothScale() {
  const deviceRef = useRef<BluetoothDeviceLike | null>(null);
  const characteristicsRef = useRef<BluetoothCharacteristics>({ weight: null, led: null });
  const samplesRef = useRef<WeightSample[]>([]);
  const stableWeightRef = useRef(0);

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

  useEffect(() => {
    return () => {
      if (deviceRef.current?.gatt?.connected && deviceRef.current.gatt.disconnect) {
        deviceRef.current.gatt.disconnect();
      }
    };
  }, []);

  const handleWeightUpdate = (value: number) => {
    const normalized = Number(value.toFixed(1));
    const sample = { value: normalized, timestamp: Date.now() };
    const nextSamples = [...samplesRef.current, sample].slice(-STABLE_SAMPLE_COUNT);
    samplesRef.current = nextSamples;
    setLatestWeight(normalized);
    setWeightSamples(nextSamples.map((entry) => entry.value));

    if (normalized <= 0.5) {
      setMeasurementStatus(isConnected ? "idle" : "disconnected");
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

  const connect = async () => {
    if (!supported) {
      setLastMessage(DEFAULT_MESSAGE);
      return { success: false, message: DEFAULT_MESSAGE };
    }

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
      setMeasurementStatus("idle");

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
    setIsBypassMode(true);
    setIsConnected(false);
    setMeasurementStatus("disconnected");
    setLastMessage("");
  };

  const disconnect = () => {
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
    setMeasurementStatus("disconnected");
    setSelectedLED("");
    setLastServingEvent(null);
  };

  const tare = async () => {
    const success = await writeCommand(characteristicsRef.current.led, "TARE");

    if (!success) {
      return { success: false, message: "Connect the scale before calibrating." };
    }

    samplesRef.current = [];
    stableWeightRef.current = 0;
    setLatestWeight(0);
    setStableWeight(0);
    setWeightSamples([]);
    setMeasurementStatus("idle");
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
          ? "Bypass mode"
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
