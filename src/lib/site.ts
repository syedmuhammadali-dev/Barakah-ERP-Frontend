export const SITE_NAME = "Barakah ERP";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://barakah-erp.vercel.app"
).replace(/\/+$/, "");

export function absoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
}
