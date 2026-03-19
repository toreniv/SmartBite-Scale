"use client";

export type DebugLogEntry = {
  id: number;
  timestamp: number;
  tag: string;
  message: string;
  data?: unknown;
};

type DebugLogListener = () => void;

const MAX_LOG_ENTRIES = 100;
const logEntries: DebugLogEntry[] = [];
const listeners = new Set<DebugLogListener>();
let nextLogId = 1;

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function safeSerialize(data: unknown) {
  if (data === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(data)) as unknown;
  } catch {
    return String(data);
  }
}

export function log(tag: string, message: string, data?: unknown) {
  logEntries.push({
    id: nextLogId,
    timestamp: Date.now(),
    tag,
    message,
    ...(data !== undefined ? { data: safeSerialize(data) } : {}),
  });
  nextLogId += 1;

  while (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.shift();
  }

  notifyListeners();
}

export function getDebugLogs() {
  return [...logEntries];
}

export function subscribeToDebugLogs(listener: DebugLogListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function clearDebugLogs() {
  logEntries.length = 0;
  notifyListeners();
}

function formatLogData(data: unknown) {
  if (data === undefined) {
    return "";
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function formatDebugLogsAsText(entries: DebugLogEntry[]) {
  return entries
    .map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString("en-GB", {
        hour12: false,
      });
      const dataText = formatLogData(entry.data);

      return dataText
        ? `[${time}] [${entry.tag}] ${entry.message}\n${dataText}`
        : `[${time}] [${entry.tag}] ${entry.message}`;
    })
    .join("\n\n");
}
