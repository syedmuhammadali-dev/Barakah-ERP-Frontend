"use client";

import { Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/lib/i18n";

export function LanguageToggle() {
  const { isUrdu, toggleLocale, t } = useAppLocale();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={toggleLocale}
      aria-label={isUrdu ? t("common.english") : t("common.urdu")}
    >
      <Globe2 className="h-4 w-4" />
      <span>{isUrdu ? t("common.english") : t("common.urdu")}</span>
    </Button>
  );
}

