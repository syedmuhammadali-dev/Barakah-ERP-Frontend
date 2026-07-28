export function apiUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalizedPath;
}

export async function apiRequest<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(pathname), {
    credentials: "include",
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    let message = "";
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText) as Record<string, unknown>;
        const field = parsed.message ?? parsed.error ?? parsed.detail;
        message = typeof field === "string" ? field : "";
      } catch {
        message = rawText;
      }
    }
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
