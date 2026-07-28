/**
 * Extracts a human-readable message from an error thrown by apiRequest()
 * or by the generated react-query hooks (ApiError from customFetch).
 * Falls back to a friendly default instead of ever showing raw JSON/stack traces.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const raw = error.message.trim();
  if (!raw) {
    return fallback;
  }

  // ApiError messages look like "HTTP 400 Bad Request: SKU already exists".
  // Strip the technical prefix so only the human-readable part remains.
  const withoutPrefix = raw.replace(/^HTTP \d{3}[^:]*:\s*/, "").trim();
  if (!withoutPrefix || /^HTTP \d{3}/.test(withoutPrefix)) {
    return fallback;
  }

  return withoutPrefix;
}
