import type {
  ActivityLevel,
  GoalType,
  RecommendationItem,
  UserProfile,
} from "@/lib/types";

export const SCALE_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
export const WEIGHT_CHARACTERISTIC_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
export const LED_SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
export const LED_CHARACTERISTIC_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

export const LED_COMMANDS = ["RED", "GREEN", "BLUE", "YELLOW", "OFF"] as const;

export const STORAGE_KEYS = {
  meals: "smartbite:meals",
  profile: "smartbite:profile",
} as const;

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; multiplier: number }> = {
  sedentary: { label: "Sedentary", multiplier: 1.2 },
  light: { label: "Lightly active", multiplier: 1.375 },
  moderate: { label: "Moderately active", multiplier: 1.55 },
  active: { label: "Active", multiplier: 1.725 },
  "very-active": { label: "Very active", multiplier: 1.9 },
};

export const GOAL_LABELS: Record<GoalType, string> = {
  "lose-weight": "Lose weight",
  maintain: "Maintain",
  "gain-muscle": "Gain muscle",
};

export const DEFAULT_PROFILE: UserProfile = {
  age: 29,
  sex: "female",
  heightCm: 168,
  weightKg: 64,
  activityLevel: "moderate",
  goalType: "maintain",
  targetWeightKg: 62,
};

export const APP_DISCLAIMER =
  "Nutrition estimates are supportive guidance only and are not a medical diagnosis.";

export const EMPTY_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: "start-1",
    title: "Connect your scale for better estimates",
    body: "Stable weight readings help the app produce more grounded calorie and macro estimates.",
    tone: "neutral",
  },
  {
    id: "start-2",
    title: "Complete your profile",
    body: "Your calorie target and progress adapt once your height, weight, and goal are saved.",
    tone: "good",
  },
];
