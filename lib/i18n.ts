import { translations } from "@/lib/translations";
import type { LanguageCode } from "@/lib/types";

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function getDirection(language: LanguageCode) {
  return language === "he" ? "rtl" : "ltr";
}

export function getDictionary(language: LanguageCode) {
  return translations[language];
}

function readPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
}

export function formatMessage(template: string, values?: Record<string, string | number>) {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = String(rawKey).trim();
    return values[key] === undefined ? "" : String(values[key]);
  });
}

export function translate(
  language: LanguageCode,
  path: string,
  values?: Record<string, string | number>,
) {
  const dictionary = getDictionary(language) as Record<string, unknown>;
  const resolved = readPath(dictionary, path);

  if (typeof resolved !== "string") {
    return path;
  }

  return formatMessage(resolved, values);
}
