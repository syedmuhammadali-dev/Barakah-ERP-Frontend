"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { LocaleProvider } from "@/lib/i18n";
import { RouteTransitionProvider } from "@/components/route-transition";
import { setBaseUrl } from "@barakah/api-client-react";
import { API_BASE_URL } from "@/lib/api";

setBaseUrl(API_BASE_URL || null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: () => {
            // Handled by local section-level error states.
          },
        }),
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LocaleProvider>
        <RouteTransitionProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </RouteTransitionProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
