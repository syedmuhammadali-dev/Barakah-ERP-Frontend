"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useAppLocale } from "@/lib/i18n";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useAppLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">{t("errors.somethingWentWrong")}</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("errors.unexpectedError")}
          </p>

          <Button className="mt-6" onClick={() => reset()}>
            {t("errors.tryAgain")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
