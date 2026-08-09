export const SITE_NAME = "Barakah ERP";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://barakah-erp.vercel.app"
).replace(/\/+$/, "");

export function absoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
}

/**
 * Download link for the Windows desktop app installer. Placeholder until
 * a real Drive/GitHub Releases link is set — swap the value below (or set
 * NEXT_PUBLIC_DESKTOP_APP_URL as an env var) once one exists.
 */
export const DESKTOP_APP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DESKTOP_APP_URL ?? "https://example.com/barakah-desktop-app-demo";
