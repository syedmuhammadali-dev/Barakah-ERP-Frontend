"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAppLocale } from "@/lib/i18n";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useAppLocale();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("theme.toggleToLight") : t("theme.toggleToDark")}
    >
      {isDark ? (
        <>
          <SunMedium className="h-4 w-4" />
          <span>{t("theme.toggleToLight")}</span>
        </>
      ) : (
        <>
          <MoonStar className="h-4 w-4" />
          <span>{t("theme.toggleToDark")}</span>
        </>
      )}
    </Button>
  );
}
