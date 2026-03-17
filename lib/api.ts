function normalizeApiPath(path: string) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, "") : "";
}

export function buildApiUrl(path: string) {
  const normalizedPath = normalizeApiPath(path);
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
}
