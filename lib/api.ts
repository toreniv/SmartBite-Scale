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

export function buildApiUrl(path: string) {
  const normalizedPath = normalizeApiPath(path);
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return normalizedPath;
  }

  return new URL(normalizedPath, `${baseUrl}/`).toString();
}
