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
  BluetoothConnectionStatus,
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
  latestResultImageUrl,
  measuredWeight,
  disclaimer,
  recommendations,
  isConnected,
  isDemoMode,
  bluetoothEnabled,
  connectionStatus,
  isReconnecting,
  isStreamEnabled,
  hasConfirmedPong,
  latestWeight,
  stableWeight,
  measurementStatus,
  lastBluetoothMessage,
  navDirection,
  onConnectScale,
  onTare,
  onToggleStream,
  onGoCapture,
}: {
  profile: UserProfile;
  metrics: HealthMetrics;
  progress: DailyProgress;
  latestResult: MealAnalysisResult | null;
  latestResultImageUrl?: string | null;
  measuredWeight: number | null;
  disclaimer: string;
  recommendations: RecommendationItem[];
  isConnected: boolean;
  isDemoMode: boolean;
  bluetoothEnabled: boolean;
  connectionStatus: BluetoothConnectionStatus;
  isReconnecting: boolean;
  isStreamEnabled: boolean;
  hasConfirmedPong: boolean;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: "disconnected" | "idle" | "measuring" | "stable";
  lastBluetoothMessage: string;
  navDirection: NavDirection;
  onConnectScale: () => void;
  onTare: () => void;
  onToggleStream: (enabled: boolean) => void;
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
        isDemoMode={isDemoMode}
        bluetoothEnabled={bluetoothEnabled}
        connectionStatus={connectionStatus}
        isReconnecting={isReconnecting}
        isStreamEnabled={isStreamEnabled}
        hasConfirmedPong={hasConfirmedPong}
        latestWeight={latestWeight}
        stableWeight={stableWeight}
        measurementStatus={measurementStatus}
        lastMessage={lastBluetoothMessage}
        onConnect={onConnectScale}
        onTare={onTare}
        onToggleStream={onToggleStream}
      />

      {latestResult ? (
        <AnalysisResultCard
          result={latestResult}
          imageUrl={latestResultImageUrl}
          measuredWeight={measuredWeight}
          disclaimer={disclaimer}
        />
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
