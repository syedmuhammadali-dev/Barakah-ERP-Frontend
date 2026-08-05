"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@barakah/auth-web";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppLink, useRouteTransition } from "@/components/route-transition";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppLocale } from "@/lib/i18n";

export function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { beginTransition } = useRouteTransition();
  const { t } = useAppLocale();
  const [email, setEmail] = useState("local@barakah.dev");
  const [password, setPassword] = useState("03182927392");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void router.prefetch("/dashboard");
    void router.prefetch("/signup");
    if (!isLoading && isAuthenticated) {
      beginTransition();
      router.replace("/dashboard");
    }
  }, [beginTransition, isAuthenticated, isLoading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Login failed");
      }

      beginTransition();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <div className="hidden lg:block space-y-6 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <ShieldCheck className="h-4 w-4" />
            Secure local ERP access
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Sign in to Barakah ERP
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Use the local demo account to test inventory, sales, zakat, and
            reporting flows exactly like a real deployment.
          </p>
          <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Demo credentials
            </p>
            <p className="font-mono text-sm">Email: local@barakah.dev</p>
            <p className="font-mono text-sm">Password: 03182927392</p>
          </div>
        </div>

        <Card className="border-border shadow-2xl shadow-black/20">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{t("auth.signInHeading")}</CardTitle>
                <CardDescription>{t("auth.signInSubheading")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageToggle />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <AppLink
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                {t("auth.backHome")}
              </AppLink>
            </div>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="local@barakah.dev"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? t("auth.hidePassword") : t("auth.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  t("common.loading")
                ) : (
                  <>
                    {t("auth.signIn")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("auth.needAccount")}</span>
                <AppLink href="/signup" className="text-primary hover:underline">
                  {t("auth.signup")}
                </AppLink>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
