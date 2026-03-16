"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { DEFAULT_LANGUAGE, getDictionary, getDirection, translate } from "@/lib/i18n";
import { readStorage, writeStorage } from "@/lib/storage";
import type { LanguageCode } from "@/lib/types";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  dictionary: ReturnType<typeof getDictionary>;
  t: (path: string, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = readStorage<LanguageCode>(STORAGE_KEYS.language, DEFAULT_LANGUAGE);
    setLanguage(stored);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dir = getDirection(language);

    return {
      language,
      setLanguage,
      dir,
      isRTL: dir === "rtl",
      dictionary: getDictionary(language),
      t: (path, values) => translate(language, path, values),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}
