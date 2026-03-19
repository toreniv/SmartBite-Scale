import type { DiscoveredDevice } from "@/lib/types";

const BLE_UNAVAILABLE_MESSAGE =
  "BLE scale support is reserved for future SmartBite hardware and is not implemented in this build.";

export function getBleUnavailableMessage() {
  return BLE_UNAVAILABLE_MESSAGE;
}

export async function scanBleDevices(): Promise<DiscoveredDevice[]> {
  throw new Error(BLE_UNAVAILABLE_MESSAGE);
}
