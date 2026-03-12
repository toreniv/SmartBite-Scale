import {
  LED_CHARACTERISTIC_UUID,
  LED_SERVICE_UUID,
  SCALE_SERVICE_UUID,
  WEIGHT_CHARACTERISTIC_UUID,
} from "@/lib/constants";
import type {
  BluetoothCharacteristics,
  BluetoothDeviceLike,
  BluetoothLike,
  BluetoothRemoteGATTCharacteristicLike,
  DiscoveredDevice,
} from "@/lib/types";

export function getBluetooth(): BluetoothLike | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  return (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth ?? null;
}

export function isBluetoothSupported() {
  return Boolean(getBluetooth());
}

export async function requestScaleDevice() {
  const bluetooth = getBluetooth();

  if (!bluetooth) {
    throw new Error(
      "Bluetooth is not supported in this browser. Please use Chrome or Edge on a supported device.",
    );
  }

  const device = await bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [SCALE_SERVICE_UUID, WEIGHT_CHARACTERISTIC_UUID, LED_SERVICE_UUID],
  });

  const discoveredDevice: DiscoveredDevice = {
    id: device.id ?? crypto.randomUUID(),
    name: device.name?.trim() || "SmartBite Scale",
    signalStrength: null,
  };

  return { device, discoveredDevice };
}

export async function connectScale(
  device: BluetoothDeviceLike,
): Promise<BluetoothCharacteristics> {
  const server = await device.gatt?.connect();

  if (!server) {
    throw new Error("Failed to connect to the scale.");
  }

  const weightService = await server.getPrimaryService(SCALE_SERVICE_UUID);
  const ledService = await server.getPrimaryService(LED_SERVICE_UUID);

  return {
    weight: await weightService.getCharacteristic(WEIGHT_CHARACTERISTIC_UUID),
    led: await ledService.getCharacteristic(LED_CHARACTERISTIC_UUID),
  };
}

export async function subscribeToWeight(
  characteristic: BluetoothRemoteGATTCharacteristicLike,
  onWeight: (weight: number) => void,
) {
  await characteristic.startNotifications();
  characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristicLike | null;
    const value = target?.value;

    if (!value) {
      return;
    }

    onWeight(value.getFloat32(0, true));
  });
}

export async function writeCommand(
  characteristic: BluetoothRemoteGATTCharacteristicLike | null,
  command: string,
  value?: number,
) {
  if (!characteristic) {
    return false;
  }

  const encoder = new TextEncoder();
  const payload = value === undefined ? command : `${command} ${value}`;
  await characteristic.writeValue(encoder.encode(`${payload}\n`));
  return true;
}
