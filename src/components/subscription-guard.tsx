 "use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [showGuard, setShowGuard] = useState(false);
  const router = useRouter();

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

  if (showGuard) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="max-w-md w-full p-8 bg-card border border-border shadow-2xl rounded-xl text-center space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Subscription Expired
            </h2>
            <p className="text-muted-foreground">
              Your free trial has ended or your subscription has expired. Please
              renew to continue using Barakah ERP.
            </p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-lg">
            PKR 10,000 / month
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
              Renew Now
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={() => router.push("/subscription")}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
