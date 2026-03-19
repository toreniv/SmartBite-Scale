import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import type {
  BluetoothAvailabilityState,
  BluetoothPermissionStatus,
  DiscoveredDevice,
} from "@/lib/types";

type NativePermissionStatus = {
  scan?: string;
  connect?: string;
  location?: string;
};

type NativeBluetoothStatus = {
  supported: boolean;
  enabled: boolean;
  discovering: boolean;
  connected: boolean;
  permissionBlocked?: boolean;
  permissions?: NativePermissionStatus;
  device?: NativeBluetoothDevice | null;
};

type NativeBluetoothDevice = {
  address: string;
  name?: string | null;
  rssi?: number | null;
  isPaired?: boolean;
  isHc06?: boolean;
};

type DiscoveryStateChangedEvent = {
  isDiscovering: boolean;
};

type DeviceFoundEvent = {
  device: NativeBluetoothDevice;
};

type SerialMessageEvent = {
  line: string;
};

type ConnectionStateChangedEvent = {
  status: "connecting" | "connected" | "disconnected" | "error";
  message?: string;
  device?: NativeBluetoothDevice | null;
};

interface BluetoothClassicPlugin {
  getStatus(): Promise<NativeBluetoothStatus>;
  requestBluetoothPermissions(): Promise<NativeBluetoothStatus>;
  requestEnable(): Promise<{ enabled: boolean }>;
  openAppSettings(): Promise<{ opened: boolean }>;
  getPairedDevices(): Promise<{ devices: NativeBluetoothDevice[] }>;
  startDiscovery(): Promise<{ started: boolean }>;
  stopDiscovery(): Promise<{ stopped: boolean }>;
  connect(options: { address: string }): Promise<{ device: NativeBluetoothDevice }>;
  disconnect(): Promise<{ disconnected: boolean }>;
  send(options: { value: string }): Promise<{ sent: boolean }>;
  addListener(
    eventName: "discoveryStateChanged",
    listenerFunc: (event: DiscoveryStateChangedEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "deviceFound",
    listenerFunc: (event: DeviceFoundEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "serialMessage",
    listenerFunc: (event: SerialMessageEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "connectionStateChanged",
    listenerFunc: (event: ConnectionStateChangedEvent) => void,
  ): Promise<PluginListenerHandle>;
}

const DISCOVERY_TIMEOUT_MS = 10_000;
const BluetoothClassic = registerPlugin<BluetoothClassicPlugin>("BluetoothClassic");

function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function normalizePermissionState(value?: string): BluetoothPermissionStatus[keyof BluetoothPermissionStatus] {
  if (value === "granted" || value === "denied" || value === "prompt") {
    return value;
  }

  return "unknown";
}

function normalizePermissions(
  permissions?: NativePermissionStatus,
): BluetoothPermissionStatus {
  return {
    scan: normalizePermissionState(permissions?.scan),
    connect: normalizePermissionState(permissions?.connect),
    location: normalizePermissionState(permissions?.location),
  };
}

function normalizeDevice(device: NativeBluetoothDevice): DiscoveredDevice {
  const name = device.name?.trim() || "Unknown device";
  const address = device.address.trim();
  const isHc06 = device.isHc06 ?? /hc-0?6/i.test(name);

  return {
    id: address,
    address,
    name,
    signalStrength: typeof device.rssi === "number" ? device.rssi : null,
    transport: "classic",
    isPaired: Boolean(device.isPaired),
    isHc06,
  };
}

function sortDevices(devices: DiscoveredDevice[]) {
  return [...devices].sort((left, right) => {
    if (left.isHc06 !== right.isHc06) {
      return left.isHc06 ? -1 : 1;
    }

    if (left.isPaired !== right.isPaired) {
      return left.isPaired ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function toAvailabilityState(status: NativeBluetoothStatus): BluetoothAvailabilityState {
  return {
    supported: status.supported,
    enabled: status.enabled,
    discovering: status.discovering,
    connected: status.connected,
    permissions: normalizePermissions(status.permissions),
    permissionBlocked: Boolean(status.permissionBlocked),
  };
}

export function isBluetoothClassicSupported() {
  return isNativeAndroid();
}

export function getBluetoothClassicUnavailableMessage() {
  if (isNativeAndroid()) {
    return "Bluetooth Classic is unavailable on this device.";
  }

  return "Bluetooth Classic scanning is only available in the Android app build.";
}

export async function getBluetoothClassicStatus() {
  if (!isNativeAndroid()) {
    return {
      supported: false,
      enabled: false,
      discovering: false,
      connected: false,
      permissions: {
        scan: "unknown",
        connect: "unknown",
        location: "unknown",
      },
    } satisfies BluetoothAvailabilityState;
  }

  return toAvailabilityState(await BluetoothClassic.getStatus());
}

export async function requestBluetoothClassicPermissions() {
  if (!isNativeAndroid()) {
    throw new Error(getBluetoothClassicUnavailableMessage());
  }

  return toAvailabilityState(await BluetoothClassic.requestBluetoothPermissions());
}

export async function requestEnableBluetoothClassic() {
  if (!isNativeAndroid()) {
    throw new Error(getBluetoothClassicUnavailableMessage());
  }

  return BluetoothClassic.requestEnable();
}

export async function openBluetoothClassicAppSettings() {
  if (!isNativeAndroid()) {
    throw new Error(getBluetoothClassicUnavailableMessage());
  }

  return BluetoothClassic.openAppSettings();
}

export async function connectBluetoothClassicDevice(device: DiscoveredDevice) {
  if (!isNativeAndroid()) {
    throw new Error(getBluetoothClassicUnavailableMessage());
  }

  const result = await BluetoothClassic.connect({ address: device.address });
  return normalizeDevice(result.device);
}

export async function disconnectBluetoothClassicDevice() {
  if (!isNativeAndroid()) {
    return;
  }

  await BluetoothClassic.disconnect();
}

export async function sendBluetoothClassicCommand(command: string) {
  if (!isNativeAndroid()) {
    return false;
  }

  const result = await BluetoothClassic.send({ value: command });
  return result.sent;
}

export async function subscribeToBluetoothClassicMessages(
  onLine: (line: string) => void,
) {
  if (!isNativeAndroid()) {
    return {
      remove: async () => undefined,
    };
  }

  return BluetoothClassic.addListener("serialMessage", (event) => {
    if (typeof event.line === "string" && event.line.trim()) {
      onLine(event.line);
    }
  });
}

export async function subscribeToBluetoothClassicConnectionState(
  onStateChange: (event: ConnectionStateChangedEvent) => void,
) {
  if (!isNativeAndroid()) {
    return {
      remove: async () => undefined,
    };
  }

  return BluetoothClassic.addListener("connectionStateChanged", onStateChange);
}

export async function scanBluetoothClassicDevices(options?: {
  onDevicesChanged?: (devices: DiscoveredDevice[]) => void;
}) {
  if (!isNativeAndroid()) {
    throw new Error(getBluetoothClassicUnavailableMessage());
  }

  const deviceMap = new Map<string, DiscoveredDevice>();
  const notify = () => {
    options?.onDevicesChanged?.(sortDevices([...deviceMap.values()]));
  };

  const paired = await BluetoothClassic.getPairedDevices();
  for (const device of paired.devices) {
    const normalized = normalizeDevice(device);
    deviceMap.set(normalized.address, normalized);
  }
  notify();

  let discoveryStarted = false;
  let timeoutId: number | null = null;
  let resolveScan: (() => void) | null = null;

  const completionPromise = new Promise<void>((resolve) => {
    resolveScan = resolve;
  });

  const foundHandle = await BluetoothClassic.addListener("deviceFound", (event) => {
    const normalized = normalizeDevice(event.device);
    deviceMap.set(normalized.address, normalized);
    notify();
  });

  const stateHandle = await BluetoothClassic.addListener("discoveryStateChanged", (event) => {
    if (event.isDiscovering) {
      discoveryStarted = true;
      return;
    }

    if (discoveryStarted) {
      resolveScan?.();
    }
  });

  try {
    await BluetoothClassic.startDiscovery();
    timeoutId = window.setTimeout(() => {
      void BluetoothClassic.stopDiscovery().catch(() => undefined);
      resolveScan?.();
    }, DISCOVERY_TIMEOUT_MS);

    await completionPromise;
  } catch (error) {
    await BluetoothClassic.stopDiscovery().catch(() => undefined);
    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    await foundHandle.remove();
    await stateHandle.remove();
  }

  return sortDevices([...deviceMap.values()]);
}
