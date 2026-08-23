import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/inventory",
        "/sales",
        "/mechanic-bills",
        "/bills",
        "/reports",
        "/zakat",
        "/salesmen",
        "/suppliers",
        "/settings",
        "/data-viewer",
        "/notes",
        "/subscription",
        "/onboarding",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
