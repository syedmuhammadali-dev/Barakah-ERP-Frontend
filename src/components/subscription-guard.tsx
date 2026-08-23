"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useGetSubscriptionStatus } from "@barakah/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAppLocale } from "@/lib/i18n";

const POPUP_INTERVAL_MS = 60_000;

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [showGuard, setShowGuard] = useState(false);
  const router = useRouter();
  const { t } = useAppLocale();
  const { toast } = useToast();

  const { data: status } = useGetSubscriptionStatus({
    query: { queryKey: ["subscriptionStatus"], refetchInterval: POPUP_INTERVAL_MS },
  });

  const restricted = Boolean(status?.restricted);
  const pausedByAdmin = Boolean(status?.pausedByAdmin);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.action.error as any;
        if (
          error?.status === 402 ||
          error?.response?.status === 402 ||
          error?.message?.includes("402")
        ) {
          setShowGuard(true);
        }
      }
    });

    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event) => {
        if (event.type === "updated" && event.action.type === "error") {
          const error = event.action.error as any;
          if (
            error?.status === 402 ||
            error?.response?.status === 402 ||
            error?.message?.includes("402")
          ) {
            setShowGuard(true);
          }
        }
      });

    return () => {
      unsubscribe();
      unsubscribeMutations();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!restricted) return;

    const message = pausedByAdmin ? t("subscription.restrictedPaused") : t("subscription.restrictedMessage");
    toast({ title: t("subscription.restrictedTitle"), description: message, variant: "destructive" });

    const interval = setInterval(() => {
      toast({ title: t("subscription.restrictedTitle"), description: message, variant: "destructive" });
    }, POPUP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [restricted, pausedByAdmin, t, toast]);

  if (showGuard) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="max-w-md w-full p-8 bg-card border border-border shadow-2xl rounded-xl text-center space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("subscription.expiredGuardTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("subscription.expiredGuardMessage")}
            </p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-lg">
            PKR 5,000 / month
          </div>
          <div className="flex gap-4">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => {
                setShowGuard(false);
                router.push("/subscription");
              }}
            >
              {t("subscription.renewNow")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              asChild
            >
              <a href="mailto:support@barakah-erp.com">
                {t("subscription.contactSupport")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {restricted && (
        <div className="sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-2 bg-destructive text-destructive-foreground px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {t("subscription.restrictedTitle")} — {pausedByAdmin ? t("subscription.restrictedPaused") : t("subscription.restrictedMessage")}
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push("/subscription")}
          >
            {t("subscription.renewSubscription")}
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
