export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";

export type GoalType = "lose-weight" | "maintain" | "gain-muscle";

export type AppPhase = "welcome" | "connect" | "app";

export type AppSection = "home" | "capture" | "history" | "profile" | "debug";

export type AnalysisProvider = "openai" | "gemini" | "mock";

export type PermissionStateLike = "granted" | "denied" | "prompt" | "unknown";

export type LEDColor = "RED" | "GREEN" | "BLUE" | "YELLOW" | "OFF";

export type MeasurementStatus = "disconnected" | "idle" | "measuring" | "stable";

export interface UserProfile {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetWeightKg?: number;
}

export interface HealthMetrics {
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyProgress {
  goalCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  mealsLogged: number;
  macros: {
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fat: { consumed: number; target: number };
  };
}

export interface MealAnalysisResult {
  foodName: string;
  estimatedWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  explanation: string;
  provider: AnalysisProvider;
}

export interface MealHistoryItem extends MealAnalysisResult {
  id: string;
  createdAt: string;
  note?: string;
  measuredWeightGrams?: number;
  imageDataUrl?: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  body: string;
  tone: "neutral" | "good" | "warning";
}

export interface DiscoveredDevice {
  id: string;
  name: string;
  signalStrength: number | null;
}

export interface BluetoothRemoteGATTCharacteristicLike {
  value?: DataView | null;
  startNotifications: () => Promise<BluetoothRemoteGATTCharacteristicLike>;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  writeValue: (value: BufferSource) => Promise<void>;
}

export interface BluetoothRemoteGATTServiceLike {
  getCharacteristic: (
    characteristicUuid: string,
  ) => Promise<BluetoothRemoteGATTCharacteristicLike>;
}

export interface BluetoothRemoteGATTServerLike {
  connected?: boolean;
  connect: () => Promise<BluetoothRemoteGATTServerLike>;
  disconnect?: () => void;
  getPrimaryService: (
    serviceUuid: string,
  ) => Promise<BluetoothRemoteGATTServiceLike>;
}

export interface BluetoothDeviceLike {
  id?: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServerLike;
}

export interface BluetoothLike {
  requestDevice: (options: {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }) => Promise<BluetoothDeviceLike>;
}

export interface BluetoothCharacteristics {
  weight: BluetoothRemoteGATTCharacteristicLike | null;
  led: BluetoothRemoteGATTCharacteristicLike | null;
}

export interface ServingEvent {
  detectedAt: number;
  grams: number;
}

export interface BluetoothState {
  supported: boolean;
  initialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isBypassMode: boolean;
  connectionLabel: string;
  latestWeight: number;
  stableWeight: number;
  weightSamples: number[];
  measurementStatus: MeasurementStatus;
  selectedLED: LEDColor | "";
  brightness: number;
  devices: DiscoveredDevice[];
  deviceName: string;
  lastServingEvent: ServingEvent | null;
}

export interface AnalyzeMealRequest {
  imageBase64: string;
  note?: string;
  measuredWeightGrams?: number;
  profile?: UserProfile;
}

export interface AnalyzeMealPayload extends AnalyzeMealRequest {
  fallbackToGemini?: boolean;
}

export interface AnalyzeMealResponse extends MealAnalysisResult {
  disclaimer: string;
}
