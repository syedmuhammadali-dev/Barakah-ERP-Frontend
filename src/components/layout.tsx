"use client";

import { ReactNode, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Calculator,
  Users,
  Truck,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@barakah/auth-web";
import { useGetBusinessProfile } from "@barakah/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AppLink, useRouteTransition } from "@/components/route-transition";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppLocale } from "@/lib/i18n";

export function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { beginTransition } = useRouteTransition();
  const { t } = useAppLocale();
  const { data: profile } = useGetBusinessProfile({
    query: {
      queryKey: ["businessProfile"],
      retry: false,
    },
  });

  const navigation = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.inventory"), href: "/inventory", icon: Package },
    { name: t("nav.sales"), href: "/sales", icon: ShoppingCart },
    { name: t("nav.reports"), href: "/reports", icon: BarChart3 },
    { name: t("nav.zakat"), href: "/zakat", icon: Calculator },
    { name: t("nav.salesmen"), href: "/salesmen", icon: Users },
    { name: t("nav.suppliers"), href: "/suppliers", icon: Truck },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
    { name: t("nav.subscription"), href: "/subscription", icon: CreditCard },
  ];

  useEffect(() => {
    for (const item of navigation) {
      void router.prefetch(item.href);
    }
  }, [router]);

  const getDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.email ?? "User";
  };

  const getInitials = () => {
    if (!user) return "U";
    if (user.firstName)
      return (user.firstName[0] + (user.lastName?.[0] ?? "")).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="px-4 py-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xl">
                B
              </div>
              <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
                Barakah ERP
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4">
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                        <AppLink
                          href={item.href}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </AppLink>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 px-2 mb-3">
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar className="h-10 w-10 border border-sidebar-border">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {getDisplayName()}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {profile?.businessName || "No Business"}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={async () => {
                if (isLoggingOut) return;
                setIsLoggingOut(true);
                try {
                  await logout();
                  beginTransition();
                } finally {
                  setIsLoggingOut(false);
                }
              }}
              className="flex items-center gap-3 w-full px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>{isLoggingOut ? t("common.loading") : t("nav.logout")}</span>
            </button>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto bg-background text-foreground">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
