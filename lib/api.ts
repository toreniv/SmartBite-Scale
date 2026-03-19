function normalizeApiPath(path: string) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!baseUrl) {
    return "";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use http or https.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

function isStandaloneStaticRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.protocol === "capacitor:" || window.location.protocol === "file:";
}

export function buildApiUrl(path: string) {
  const normalizedPath = normalizeApiPath(path);
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    if (isStandaloneStaticRuntime()) {
      throw new Error(
        "Backend URL not configured. Set NEXT_PUBLIC_API_BASE_URL to connect to the analysis server.",
      );
    }

    return normalizedPath;
  }

  return new URL(normalizedPath, `${baseUrl}/`).toString();
}
