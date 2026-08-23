"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  BarChart3,
  Calculator,
  Store,
  Globe,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@barakah/auth-web";
import { useRouter } from "next/navigation";
import { useAppLocale } from "@/lib/i18n";
import { AppLink, useRouteTransition } from "@/components/route-transition";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useAppLocale();
  const { beginTransition } = useRouteTransition();

  useEffect(() => {
    void router.prefetch("/login");
    void router.prefetch("/signup");
    void router.prefetch("/dashboard");
    if (!isLoading && isAuthenticated) {
      beginTransition();
      router.replace("/dashboard");
    }
  }, [beginTransition, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xl">
              B
            </div>
            <span className="text-xl font-bold tracking-tight">
              Barakah ERP
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              {t("landing.navFeatures")}
            </a>
            <a
              href="#compliance"
              className="hover:text-foreground transition-colors"
            >
              {t("landing.navCompliance")}
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              {t("landing.navPricing")}
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageToggle />
            <Button
              variant="ghost"
              className="hidden md:inline-flex"
              asChild
              data-testid="link-login"
            >
              <AppLink href="/login">{t("landing.login")}</AppLink>
            </Button>
            <Button
              className="font-bold"
              asChild
              data-testid="button-get-started"
            >
              <AppLink href="/signup">{t("landing.getStarted")}</AppLink>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <ShieldCheck className="w-4 h-4" /> {t("landing.trustBadge")}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              {t("landing.heroTitle")}{" "}
              <span className="text-primary">{t("landing.heroTitleHighlight")}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg h-14 px-8 font-bold"
                asChild
                data-testid="button-hero-cta"
              >
                <AppLink href="/signup">
                  {t("landing.getStarted")} <ChevronRight className="ml-2 w-5 h-5" />
                </AppLink>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg h-14 px-8 border-border"
                asChild
                data-testid="button-book-demo"
              >
                <AppLink href="/login?demo=1">{t("landing.bookDemo")}</AppLink>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="py-24 bg-muted/30 border-y border-border px-6"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("landing.feature1Title")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.feature1Desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("landing.feature2Title")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.feature2Desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("landing.feature3Title")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.feature3Desc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="py-24 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                {t("landing.complianceTitle")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("landing.complianceDesc")}
              </p>
              <ul className="space-y-4">
                {[
                  t("landing.complianceItem1"),
                  t("landing.complianceItem2"),
                  t("landing.complianceItem3"),
                  t("landing.complianceItem4"),
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full" />
              <Card className="relative border-primary/20 bg-background/50 backdrop-blur-sm overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                        {t("landing.netZakatableAssets")}
                      </p>
                      <h3 className="text-4xl font-bold">PKR 485,200</h3>
                    </div>
                    <Calculator className="w-10 h-10 text-primary opacity-50" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("landing.inventoryValueLabel")}
                      </span>
                      <span className="font-mono">PKR 320,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("landing.cashOnHandLabel")}
                      </span>
                      <span className="font-mono">PKR 185,200</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive">
                      <span>{t("landing.deductibleDebtsLabel")}</span>
                      <span className="font-mono">- PKR 20,000</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between font-bold text-primary">
                      <span>{t("landing.zakatDueLabel")}</span>
                      <span>PKR 12,130</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 bg-muted/30 border-y border-border px-6"
      >
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("landing.pricingTitle")}
          </h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">
            {t("landing.pricingSubtitle")}
          </p>

          <div className="max-w-md mx-auto text-left">
            <Card className="border-primary shadow-[0_0_30px_-10px_rgba(255,193,7,0.3)] relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                {t("landing.recommended")}
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">{t("landing.singlePlanName")}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold">PKR 5,000</span>
                  <span className="text-muted-foreground">{t("landing.perMonth")}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {t("landing.singlePlanFeature1")}
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {t("landing.singlePlanFeature2")}
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {t("landing.singlePlanFeature3")}
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {t("landing.singlePlanFeature4")}
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {t("landing.singlePlanFeature5")}
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {t("landing.singlePlanFeature6")}
                  </li>
                </ul>
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full font-bold"
                    asChild
                    data-testid="button-plan-single"
                  >
                    <AppLink href="/signup">{t("landing.getStarted")}</AppLink>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                    data-testid="button-plan-book-demo"
                  >
                    <AppLink href="/login?demo=1">{t("landing.bookDemo")}</AppLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
              B
            </div>
            Barakah ERP
          </div>
          <div className="flex gap-6">
            <AppLink href="/privacy" className="hover:text-foreground">
              {t("landing.footerPrivacy")}
            </AppLink>
            <AppLink href="/terms" className="hover:text-foreground">
              {t("landing.footerTerms")}
            </AppLink>
            <AppLink href="/subscription" className="hover:text-foreground">
              {t("landing.footerContact")}
            </AppLink>
          </div>
          <p>{"\u00A9"} {new Date().getFullYear()} Barakah ERP. {t("landing.footerRights")}</p>
        </div>
      </footer>
    </div>
  );
}
