"use client";

import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import type { RecommendationItem } from "@/lib/types";

const toneClasses = {
  good: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  neutral: "bg-slate-50 text-slate-700",
};

export function RecommendationCard({ item }: { item: RecommendationItem }) {
  const { t } = useLanguage();

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-2 ${toneClasses[item.tone]}`}>
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {t(`recommendations.${item.id}Title`)}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {t(`recommendations.${item.id}Body`)}
          </p>
        </div>
      </div>
    </Card>
  );
}
