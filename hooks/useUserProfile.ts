"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PROFILE, STORAGE_KEYS } from "@/lib/constants";
import { buildHealthMetrics } from "@/lib/health";
import { readStorage, writeStorage } from "@/lib/storage";
import type { HealthMetrics, UserProfile } from "@/lib/types";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
    setProfile(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    writeStorage(STORAGE_KEYS.profile, profile);
  }, [loaded, profile]);

  const metrics: HealthMetrics = useMemo(() => buildHealthMetrics(profile), [profile]);

  const hasCompletedProfile = Boolean(
    profile.age && profile.heightCm && profile.weightKg && profile.activityLevel && profile.goalType,
  );

  return {
    profile,
    setProfile,
    metrics,
    hasCompletedProfile,
  };
}
