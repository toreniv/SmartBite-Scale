"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MealHistoryCard } from "@/components/cards/MealHistoryCard";
import { Card } from "@/components/ui/Card";
import { PlateStage } from "@/components/ui/PlateStage";
import { useLanguage } from "@/hooks/useLanguage";
import { formatTime } from "@/lib/nutrition";
import type { MealHistoryItem, NavDirection } from "@/lib/types";

export function HistoryScreen({
  meals,
  navDirection,
  onDeleteMeal,
  onMealRemoved,
}: {
  meals: MealHistoryItem[];
  navDirection: NavDirection;
  onDeleteMeal: (mealId: string) => void;
  onMealRemoved: () => void;
}) {
  const { t } = useLanguage();
  const [selectedMeal, setSelectedMeal] = useState<MealHistoryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedMealConfidence = useMemo(() => {
    if (!selectedMeal) {
      return 0;
    }

    return selectedMeal.confidence <= 1
      ? Math.round(selectedMeal.confidence * 100)
      : Math.round(selectedMeal.confidence);
  }, [selectedMeal]);

  const selectedMealWeight = useMemo(() => {
    if (!selectedMeal) {
      return 0;
    }

    return selectedMeal.measuredWeightGrams ?? selectedMeal.estimatedWeightGrams;
  }, [selectedMeal]);

  if (meals.length === 0) {
    return (
      <div className="space-y-4">
        <PlateStage currentScreen="history" mode="resultsCompact" navDirection={navDirection} />
        <Card>
          <div className="text-sm font-medium text-slate-500">{t("history.title")}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">{t("history.emptyTitle")}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("history.emptyBody")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <PlateStage currentScreen="history" mode="resultsCompact" navDirection={navDirection} />
        {meals.map((meal) => (
          <button
            key={meal.id}
            type="button"
            onClick={() => {
              setSelectedMeal(meal);
              setConfirmDelete(false);
            }}
            className="block w-full text-left transition-transform active:scale-[0.98]"
          >
            <MealHistoryCard meal={meal} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedMeal ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedMeal(null);
                setConfirmDelete(false);
              }}
            />
            <motion.div
              className="fixed inset-0 z-50 h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f0f5ff,#e8f0fe)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              <div className="mx-auto flex h-[100dvh] max-w-[430px] flex-col px-4 pb-4 pt-3">
                <div className="flex items-center justify-between pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMeal(null);
                      setConfirmDelete(false);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm active:bg-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <div className="text-sm font-semibold text-slate-950">Meal Detail</div>
                  <div className="w-[68px]" />
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-white/70 shadow-[0_20px_50px_rgba(30,64,175,0.12)] ring-1 ring-white/80 backdrop-blur-xl">
                  <div className="h-[180px] w-full shrink-0 overflow-hidden bg-slate-100">
                    {selectedMeal.imageDataUrl ? (
                      <img
                        src={selectedMeal.imageDataUrl}
                        alt={selectedMeal.foodName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No meal image available
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 px-4 py-3">
                    <div className="text-[21px] font-semibold tracking-tight text-slate-950">
                      {selectedMeal.foodName}
                    </div>
                    <div className="mt-1.5 text-[12px] text-slate-500">
                      {new Date(selectedMeal.createdAt).toLocaleDateString()} •{" "}
                      {formatTime(selectedMeal.createdAt)} • Weight: {selectedMealWeight}
                      {t("common.gramsShort")}
                    </div>
                  </div>

                  <div className="mx-4 h-px bg-slate-100" />

                  <div className="shrink-0 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Nutrition breakdown
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3 text-center">
                        <div className="text-[26px] font-semibold leading-none text-slate-950">
                          {selectedMeal.calories}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">{t("common.kcal")}</div>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3 text-center">
                        <div className="text-[26px] font-semibold leading-none text-slate-950">
                          {selectedMeal.protein}g
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">{t("common.protein")}</div>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3 text-center">
                        <div className="text-[26px] font-semibold leading-none text-slate-950">
                          {selectedMeal.fat}g
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">Fat</div>
                      </div>
                    </div>
                    <div className="mt-2.5 rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-[26px] font-semibold leading-none text-slate-950">
                        {selectedMeal.carbs}g
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">Carbs</div>
                    </div>
                  </div>

                  <div className="mx-4 h-px bg-slate-100" />

                  <div className="min-h-0 shrink px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      AI explanation
                    </div>
                    <p
                      className="mt-2 text-[13px] leading-6 text-slate-600"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {selectedMeal.explanation || "No AI explanation available for this entry."}
                    </p>
                  </div>

                  <div className="mx-4 h-px bg-slate-100" />

                  <div className="shrink-0 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Confidence
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(135deg,#2563eb,#4f46e5)] transition-all duration-300"
                        style={{ width: `${selectedMealConfidence}%` }}
                      />
                    </div>
                    <div className="mt-1.5 text-[13px] text-slate-600">
                      AI confidence: {selectedMealConfidence}%
                    </div>
                  </div>

                  <div className="mx-4 h-px bg-slate-100" />

                  <div className="shrink-0 px-4 py-3">
                    {confirmDelete ? (
                      <div className="rounded-[18px] bg-red-50 px-4 py-3">
                        <div className="text-[13px] text-red-600">
                          Are you sure? This cannot be undone.
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm active:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteMeal(selectedMeal.id);
                              setConfirmDelete(false);
                              setSelectedMeal(null);
                              onMealRemoved();
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
                        className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 active:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete this entry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
