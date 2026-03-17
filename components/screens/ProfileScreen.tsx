"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, ChevronRight, Lock, LogOut, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { useLanguage } from "@/hooks/useLanguage";
import { logoutUser } from "@/lib/localAuth";
import type {
  ActivityLevel,
  GoalType,
  HealthMetrics,
  Sex,
  User,
  UserProfile,
} from "@/lib/types";

type NotificationSettings = {
  mealReminders: boolean;
  weeklySummary: boolean;
  goalAlerts: boolean;
};

type PrivacySettings = {
  saveMealHistory: boolean;
  anonymousAnalytics: boolean;
};

const NOTIFICATION_SETTINGS_KEY = "smartbite_notifications";
const PRIVACY_SETTINGS_KEY = "smartbite_privacy";

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  mealReminders: true,
  weeklySummary: true,
  goalAlerts: false,
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  saveMealHistory: true,
  anonymousAnalytics: false,
};

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] bg-slate-50 px-4 py-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm leading-5 text-slate-500">{hint}</div>
    </div>
  );
}

function SettingsDivider() {
  return <div className="mx-4 h-px bg-slate-100" />;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-10 rounded-full transition-all duration-200 ${
        checked ? "bg-indigo-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function ProfileScreen({
  profile,
  metrics,
  onChange,
  onOpenDebug,
  currentUser,
  onSignIn,
  onSignOut,
}: {
  profile: UserProfile;
  metrics: HealthMetrics;
  onChange: (profile: UserProfile) => void;
  onOpenDebug: () => void;
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const { t } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showSignOutToast, setShowSignOutToast] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const bannerName = currentUser?.name?.trim() || "User";
  const bannerInitial = bannerName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!showSignOutToast) {
      return;
    }

    const timeout = window.setTimeout(() => setShowSignOutToast(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [showSignOutToast]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const savedNotifications = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedNotifications) {
        setNotificationSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...(JSON.parse(savedNotifications) as Partial<NotificationSettings>),
        });
      }
    } catch {}

    try {
      const savedPrivacy = window.localStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (savedPrivacy) {
        setPrivacySettings({
          ...DEFAULT_PRIVACY_SETTINGS,
          ...(JSON.parse(savedPrivacy) as Partial<PrivacySettings>),
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(notificationSettings),
    );
  }, [notificationSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(privacySettings));
  }, [privacySettings]);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const exportSmartBiteData = () => {
    if (typeof window === "undefined") {
      return;
    }

    const data = Object.keys(window.localStorage)
      .filter((key) => key.startsWith("smartbite_"))
      .reduce<Record<string, string>>((result, key) => {
        const value = window.localStorage.getItem(key);

        if (value !== null) {
          result[key] = value;
        }

        return result;
      }, {});

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartbite-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const targetDelta = (profile.targetWeightKg ?? profile.weightKg) - profile.weightKg;
  const targetSummary =
    targetDelta === 0
      ? t("profile.targetWeightSame")
      : t(targetDelta > 0 ? "profile.targetWeightAbove" : "profile.targetWeightBelow", {
          value: Math.abs(targetDelta).toFixed(1),
        });
  const goalLabel = t(`common.goalLabel.${profile.goalType}`);
  const activityOptions: ActivityLevel[] = [
    "sedentary",
    "light",
    "moderate",
    "active",
    "very-active",
  ];
  const goalOptions: GoalType[] = ["lose-weight", "maintain", "gain-muscle"];

  return (
    <div className="relative space-y-4 pb-14">
      <div className="mt-4 mb-1 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Account
      </div>
      <div className="overflow-hidden rounded-[16px] bg-white shadow-sm">
        {currentUser ? (
          <>
            <button
              type="button"
              onClick={() => setAccountOpen((prev) => !prev)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                {bannerInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-slate-800">{bannerName}</div>
                <div className="truncate text-[12px] text-slate-500">{currentUser.email}</div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  accountOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {accountOpen && (
              <>
                <SettingsDivider />
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
                >
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 text-[14px] text-slate-800">Notifications</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${
                      notificationsOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {notificationsOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <div className="text-[14px] text-slate-800">Meal reminders</div>
                            <div className="mt-1 text-[12px] leading-5 text-slate-500">
                              Remind me to log meals during the day
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={notificationSettings.mealReminders}
                            onChange={() =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                mealReminders: !prev.mealReminders,
                              }))
                            }
                          />
                        </div>
                        <div className="my-2 h-px bg-slate-200" />
                        <div className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <div className="text-[14px] text-slate-800">Weekly summary</div>
                            <div className="mt-1 text-[12px] leading-5 text-slate-500">
                              Get a weekly nutrition report
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={notificationSettings.weeklySummary}
                            onChange={() =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                weeklySummary: !prev.weeklySummary,
                              }))
                            }
                          />
                        </div>
                        <div className="my-2 h-px bg-slate-200" />
                        <div className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <div className="text-[14px] text-slate-800">Goal alerts</div>
                            <div className="mt-1 text-[12px] leading-5 text-slate-500">
                              Alert when I exceed calorie or macro targets
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={notificationSettings.goalAlerts}
                            onChange={() =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                goalAlerts: !prev.goalAlerts,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <SettingsDivider />
                <button
                  type="button"
                  onClick={() => setPrivacyOpen((prev) => !prev)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
                >
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 text-[14px] text-slate-800">Privacy</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${
                      privacyOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {privacyOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <div className="text-[14px] text-slate-800">Save meal history</div>
                            <div className="mt-1 text-[12px] leading-5 text-slate-500">
                              Store your meal logs on this device
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={privacySettings.saveMealHistory}
                            onChange={() =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                saveMealHistory: !prev.saveMealHistory,
                              }))
                            }
                          />
                        </div>
                        <div className="my-2 h-px bg-slate-200" />
                        <div className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <div className="text-[14px] text-slate-800">Anonymous analytics</div>
                            <div className="mt-1 text-[12px] leading-5 text-slate-500">
                              Help improve the app by sharing anonymous usage data
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={privacySettings.anonymousAnalytics}
                            onChange={() =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                anonymousAnalytics: !prev.anonymousAnalytics,
                              }))
                            }
                          />
                        </div>
                        <div className="my-2 h-px bg-slate-200" />
                        <div className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <div className="text-[14px] text-slate-800">Export my data</div>
                            <div className="mt-1 text-[12px] leading-5 text-slate-500">
                              Download all your data as JSON
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={exportSmartBiteData}
                            className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-sm active:bg-slate-100"
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <SettingsDivider />
                {confirmDelete ? (
                  <div className="px-4 py-3.5">
                    <div className="text-[13px] text-red-500">
                      Are you sure? This cannot be undone.
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-medium text-slate-600 active:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          logoutUser();

                          if (typeof window !== "undefined") {
                            const keysToRemove = Object.keys(window.localStorage).filter(
                              (key) =>
                                key.startsWith("smartbite_") ||
                                key === "smartbite:auth:session" ||
                                key === "smartbite:auth:users",
                            );

                            for (const key of keysToRemove) {
                              window.localStorage.removeItem(key);
                            }

                            window.dispatchEvent(new Event("storage"));
                          }

                          setConfirmDelete(false);
                          onSignOut();
                        }}
                        className="rounded-full bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white active:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="flex-1 text-[14px] text-red-500">Delete account</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                )}
                <SettingsDivider />
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-red-50"
                  onClick={() => {
                    setConfirmDelete(false);
                    logoutUser();
                    onSignOut();
                    setShowSignOutToast(true);
                  }}
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span className="flex-1 text-[14px] text-red-500">Sign out</span>
                </button>
              </>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
          >
            <UserRound className="h-4 w-4 text-slate-400" />
            <span className="flex-1 text-[14px] text-slate-800">Sign in / Create account</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        )}
      </div>
      <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(239,246,255,0.98),rgba(255,255,255,0.95))]">
        <div className="text-sm font-medium text-blue-600">{t("profile.eyebrow")}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{t("profile.title")}</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("profile.body")}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label={t("profile.age")}>
            <Input
              type="number"
              min={16}
              max={100}
              value={profile.age}
              onChange={(e) => update("age", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("profile.sex")}>
            <Select value={profile.sex} onChange={(e) => update("sex", e.target.value as Sex)}>
              <option value="female">{t("common.sexLabel.female")}</option>
              <option value="male">{t("common.sexLabel.male")}</option>
            </Select>
          </Field>
          <Field label={t("profile.heightCm")}>
            <Input
              type="number"
              min={120}
              max={230}
              value={profile.heightCm}
              onChange={(e) => update("heightCm", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("profile.weightKg")}>
            <Input
              type="number"
              min={35}
              max={250}
              step="0.1"
              value={profile.weightKg}
              onChange={(e) => update("weightKg", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("profile.activity")} helper={t("profile.activityHelper")}>
            <Select
              value={profile.activityLevel}
              onChange={(e) =>
                update("activityLevel", e.target.value as UserProfile["activityLevel"])
              }
            >
              {activityOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`common.activityLabel.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("profile.goal")} helper={t(`common.goalDescription.${profile.goalType}`)}>
            <Select
              value={profile.goalType}
              onChange={(e) => update("goalType", e.target.value as UserProfile["goalType"])}
            >
              {goalOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`common.goalLabel.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label={t("profile.targetWeight")}
            helper={`${targetSummary} ${t("profile.targetWeightHelperSuffix")}`}
          >
            <Input
              type="number"
              min={35}
              max={250}
              step="0.1"
              value={profile.targetWeightKg ?? ""}
              onChange={(e) => update("targetWeightKg", Number(e.target.value) || undefined)}
            />
          </Field>
        </div>

        <Button variant="ghost" className="mt-4" onClick={onOpenDebug}>
          {t("common.openDebugTools")}
        </Button>
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-500">{t("profile.metricsTitle")}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricTile
            label={t("profile.bmi")}
            value={`${metrics.bmi}`}
            hint={t(`common.bmiLabel.${metrics.bmiLabel}`)}
          />
          <MetricTile
            label={t("profile.healthyRange")}
            value={`${metrics.healthyWeightRange.minKg}-${metrics.healthyWeightRange.maxKg} kg`}
            hint={t("profile.healthyRangeHint")}
          />
          <MetricTile
            label={t("profile.bmr")}
            value={`${metrics.bmr} ${t("common.kcal")}`}
            hint={t("profile.bmrHint")}
          />
          <MetricTile
            label={t("profile.tdee")}
            value={`${metrics.tdee} ${t("common.kcal")}`}
            hint={t("profile.tdeeHint")}
          />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-500">{t("profile.dailyPlan")}</div>
        <div className="mt-1 text-xl font-semibold text-slate-950">
          {t("profile.dailyPlanTitle", { goal: goalLabel })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricTile
            label={t("profile.calorieTarget")}
            value={`${metrics.dailyCalorieTarget} ${t("common.kcal")}`}
            hint={
              metrics.calorieAdjustment === 0
                ? t("profile.calorieTargetMaintenance")
                : t("profile.calorieTargetDelta", { value: metrics.calorieAdjustment })
            }
          />
          <MetricTile
            label={t("profile.proteinGoal")}
            value={`${metrics.proteinTarget} ${t("common.gramsShort")}`}
            hint={t("profile.proteinGoalHint")}
          />
          <MetricTile
            label={t("profile.waterTarget")}
            value={`${metrics.waterTargetLiters} ${t("common.litersShort")}`}
            hint={t("profile.waterTargetHint")}
          />
          <MetricTile
            label={t("profile.expectedPace")}
            value={
              metrics.goalPace.weeklyDeltaKg === 0
                ? t("profile.expectedPaceMaintain")
                : metrics.goalPace.summary
            }
            hint={
              metrics.goalPace.weeklyDeltaKg === 0
                ? t("profile.expectedPaceMaintainHint")
                : t("profile.expectedPaceMonthly", {
                    value: Math.abs(metrics.goalPace.monthlyDeltaKg),
                  })
            }
          />
        </div>
      </Card>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-2 flex justify-center transition-all duration-300 ${
          showSignOutToast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          You have been signed out
        </div>
      </div>
    </div>
  );
}
