import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@barakah/auth-web";
import { useGetBusinessProfile } from "@barakah/api-client-react";
import { AppLayout } from "@/components/layout";
import { SubscriptionGuard } from "@/components/subscription-guard";

export function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { data: businessProfile, isLoading: isProfileLoading, error: businessProfileError } = useGetBusinessProfile({
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
      const status = (businessProfileError as any)?.status ?? (businessProfileError as any)?.response?.status;
      const isProfileMissing = status === 404;

      if (isProfileMissing && router.pathname !== "/onboarding") {
        router.replace("/onboarding");
      } else if (businessProfile?.onboardingCompleted && router.pathname === "/onboarding") {
        router.replace("/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated, isProfileLoading, businessProfile, businessProfileError, router]);

  if (isAuthLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-3xl animate-pulse">B</div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading Barakah ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <SubscriptionGuard>
        <Component />
      </SubscriptionGuard>
    </AppLayout>
  );
}

