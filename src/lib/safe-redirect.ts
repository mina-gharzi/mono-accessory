const AUTH_PATHS = new Set(["/login", "/register"]);
const BASE_URL = "http://internal.local";

/**
 * Allows only same-site relative paths. Blocks absolute URLs, protocol-relative
 * URLs and paths that would send the user back to the auth pages.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback = "/account"
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, BASE_URL);

    if (url.origin !== BASE_URL || AUTH_PATHS.has(url.pathname)) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
