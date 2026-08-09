export const SITE_NAME = "Barakah ERP";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://barakah-erp.vercel.app"
).replace(/\/+$/, "");

export function absoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
}

/**
 * Download link for the Windows desktop app installer (demo build on
 * Google Drive). Override with NEXT_PUBLIC_DESKTOP_APP_URL if this ever
 * moves to GitHub Releases or another host.
 */
export const DESKTOP_APP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DESKTOP_APP_URL ?? "https://drive.google.com/file/d/1q9mABzY20YPVl20DF57PbFXd2rm1rh9s/view?usp=sharing";
