"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@barakah/auth-web";
import { useGetBusinessProfile } from "@barakah/api-client-react";
import { AppLayout } from "@/components/layout";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { AppShellSkeleton } from "@/components/app-shell-skeleton";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const {
    data: businessProfile,
    isLoading: isProfileLoading,
    error: businessProfileError,
  } = useGetBusinessProfile({
    query: {
      queryKey: ["businessProfile", user?.id],
      enabled: isAuthenticated,
      retry: false,
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && !isProfileLoading) {
      const isProfileMissing =
        businessProfileError != null || businessProfile == null;

      if (isProfileMissing && pathname !== "/onboarding") {
        router.replace("/onboarding");
      } else if (
        businessProfile?.onboardingCompleted &&
        pathname === "/onboarding"
      ) {
        router.replace("/dashboard");
      }
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    isProfileLoading,
    businessProfile,
    businessProfileError,
    pathname,
    router,
  ]);

  if (isAuthLoading || (isAuthenticated && isProfileLoading)) {
    return <AppShellSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isProfileMissing =
    businessProfileError != null || businessProfile == null;

  if (isProfileMissing) {
    if (pathname === "/onboarding") {
      return <>{children}</>;
    }
    return <AppShellSkeleton />;
  }

  return (
    <AppLayout>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </AppLayout>
  );
}
