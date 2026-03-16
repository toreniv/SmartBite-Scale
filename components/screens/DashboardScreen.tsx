"use client";

import { AnalysisResultCard } from "@/components/cards/AnalysisResultCard";
import { DailyGoalsCard } from "@/components/cards/DailyGoalsCard";
import { GoalSummaryCard } from "@/components/cards/GoalSummaryCard";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { ScaleStatusCard } from "@/components/cards/ScaleStatusCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLanguage } from "@/hooks/useLanguage";
import type {
  DailyProgress,
  HealthMetrics,
  MealAnalysisResult,
  NavDirection,
  RecommendationItem,
  UserProfile,
} from "@/lib/types";

export function DashboardScreen({
  profile,
  metrics,
  progress,
  latestResult,
  measuredWeight,
  disclaimer,
  recommendations,
  isConnected,
  latestWeight,
  stableWeight,
  measurementStatus,
  navDirection,
  onConnectScale,
  onTare,
  onGoCapture,
}: {
  profile: UserProfile;
  metrics: HealthMetrics;
  progress: DailyProgress;
  latestResult: MealAnalysisResult | null;
  measuredWeight: number;
  disclaimer: string;
  recommendations: RecommendationItem[];
  isConnected: boolean;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: "disconnected" | "idle" | "measuring" | "stable";
  navDirection: NavDirection;
  onConnectScale: () => void;
  onTare: () => void;
  onGoCapture: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <GoalSummaryCard progress={progress} />
      <DailyGoalsCard profile={profile} metrics={metrics} progress={progress} />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">{t("dashboard.macroProgress")}</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              {t("dashboard.macroSubtitle")}
            </div>
          </div>
          <Button variant="secondary" onClick={onGoCapture}>
            {t("dashboard.logMeal")}
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>{t("common.protein")}</span>
              <span>
                {progress.macros.protein.consumed}/{progress.macros.protein.target}
                {t("common.gramsShort")}
              </span>
            </div>
            <ProgressBar value={progress.macros.protein.consumed} max={progress.macros.protein.target} colorClassName="bg-emerald-500" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>{t("common.carbs")}</span>
              <span>
                {progress.macros.carbs.consumed}/{progress.macros.carbs.target}
                {t("common.gramsShort")}
              </span>
            </div>
            <ProgressBar value={progress.macros.carbs.consumed} max={progress.macros.carbs.target} colorClassName="bg-amber-400" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>{t("common.fat")}</span>
              <span>
                {progress.macros.fat.consumed}/{progress.macros.fat.target}
                {t("common.gramsShort")}
              </span>
            </div>
            <ProgressBar value={progress.macros.fat.consumed} max={progress.macros.fat.target} colorClassName="bg-pink-400" />
          </div>
        </div>
      </Card>

      <ScaleStatusCard
        isConnected={isConnected}
        latestWeight={latestWeight}
        stableWeight={stableWeight}
        measurementStatus={measurementStatus}
        onConnect={onConnectScale}
        onTare={onTare}
      />

      {latestResult ? (
        <AnalysisResultCard result={latestResult} measuredWeight={measuredWeight} disclaimer={disclaimer} />
      ) : (
        <Card>
          <div className="text-sm font-medium text-slate-500">{t("dashboard.mealAnalysis")}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">{t("dashboard.noMealsTitle")}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("dashboard.noMealsBody")}
          </p>
          <Button className="mt-4" onClick={onGoCapture}>
            {t("dashboard.startAnalysis")}
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {recommendations.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
