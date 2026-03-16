export type ParsedDeviceMessage =
  | { type: "status"; value: string; raw: string }
  | { type: "weight"; value: number; raw: string }
  | { type: "tare_done"; raw: string }
  | { type: "pong"; raw: string }
  | { type: "error"; value: string; raw: string }
  | { type: "unknown"; raw: string };

export function parseDeviceMessage(line: string): ParsedDeviceMessage | null {
  const raw = line.trim();

  if (!raw) {
    return null;
  }

  if (raw.startsWith("STATUS:")) {
    return {
      type: "status",
      value: raw.slice("STATUS:".length).trim(),
      raw,
    };
  }

  if (raw.startsWith("WEIGHT:")) {
    const value = Number.parseFloat(raw.slice("WEIGHT:".length).trim());

    if (!Number.isFinite(value)) {
      return { type: "unknown", raw };
    }

    return {
      type: "weight",
      value,
      raw,
    };
  }

  if (raw === "TARE_DONE") {
    return { type: "tare_done", raw };
  }

  if (raw === "PONG") {
    return { type: "pong", raw };
  }

  if (raw.startsWith("ERROR:")) {
    return {
      type: "error",
      value: raw.slice("ERROR:".length).trim(),
      raw,
    };
  }

  return { type: "unknown", raw };
}
