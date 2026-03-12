"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { MealAnalysisResult } from "@/lib/types";

export function AnalysisResultCard({
  result,
  measuredWeight,
  disclaimer,
}: {
  result: MealAnalysisResult;
  measuredWeight?: number;
  disclaimer: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">Latest meal estimate</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{result.foodName}</div>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">Estimated calories</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">{result.calories}</div>
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">Weight used</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {Math.round(measuredWeight ?? result.estimatedWeightGrams)}g
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-500">
            <span>Protein</span>
            <span>{result.protein}g</span>
          </div>
          <ProgressBar value={result.protein} max={50} colorClassName="bg-emerald-500" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-500">
            <span>Carbs</span>
            <span>{result.carbs}g</span>
          </div>
          <ProgressBar value={result.carbs} max={80} colorClassName="bg-amber-400" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-500">
            <span>Fat</span>
            <span>{result.fat}g</span>
          </div>
          <ProgressBar value={result.fat} max={40} colorClassName="bg-pink-400" />
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-blue-50 px-4 py-4">
        <div className="text-sm text-slate-500">Confidence</div>
        <div className="mt-1 text-lg font-semibold text-slate-950">
          {Math.round(result.confidence * 100)}%
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{result.explanation}</p>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">{disclaimer}</p>
    </Card>
  );
}
