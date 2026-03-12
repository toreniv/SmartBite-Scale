"use client";

import { AnalysisResultCard } from "@/components/cards/AnalysisResultCard";
import { GoalSummaryCard } from "@/components/cards/GoalSummaryCard";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { ScaleStatusCard } from "@/components/cards/ScaleStatusCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type {
  DailyProgress,
  MealAnalysisResult,
  RecommendationItem,
} from "@/lib/types";

export function DashboardScreen({
  progress,
  latestResult,
  measuredWeight,
  disclaimer,
  recommendations,
  isConnected,
  latestWeight,
  stableWeight,
  measurementStatus,
  onConnectScale,
  onTare,
  onGoCapture,
}: {
  progress: DailyProgress;
  latestResult: MealAnalysisResult | null;
  measuredWeight: number;
  disclaimer: string;
  recommendations: RecommendationItem[];
  isConnected: boolean;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: "disconnected" | "idle" | "measuring" | "stable";
  onConnectScale: () => void;
  onTare: () => void;
  onGoCapture: () => void;
}) {
  return (
    <div className="space-y-4">
      <GoalSummaryCard progress={progress} />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Macro progress</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">Balance across the day</div>
          </div>
          <Button variant="secondary" onClick={onGoCapture}>
            Log meal
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>Protein</span>
              <span>{progress.macros.protein.consumed}/{progress.macros.protein.target}g</span>
            </div>
            <ProgressBar value={progress.macros.protein.consumed} max={progress.macros.protein.target} colorClassName="bg-emerald-500" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>Carbs</span>
              <span>{progress.macros.carbs.consumed}/{progress.macros.carbs.target}g</span>
            </div>
            <ProgressBar value={progress.macros.carbs.consumed} max={progress.macros.carbs.target} colorClassName="bg-amber-400" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>Fat</span>
              <span>{progress.macros.fat.consumed}/{progress.macros.fat.target}g</span>
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
          <div className="text-sm font-medium text-slate-500">Meal analysis</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">No meals analyzed yet</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Capture or upload a meal to estimate calories, macros, and portion size.
          </p>
          <Button className="mt-4" onClick={onGoCapture}>
            Start analysis
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
