"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/78 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-md">
      <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500">
        <Languages className="h-4 w-4" />
      </div>
      <button
        onClick={() => setLanguage("en")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          language === "en" ? "bg-slate-900 text-white" : "text-slate-500"
        }`}
        aria-label={t("common.english")}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("he")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          language === "he" ? "bg-slate-900 text-white" : "text-slate-500"
        }`}
        aria-label={t("common.hebrew")}
      >
        HE
      </button>
    </div>
  );
}
