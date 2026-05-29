import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@barakah/auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useRouter } from "next/router";

function getReturnTo(query: Record<string, string | string[] | undefined>) {
  const raw = query.returnTo;
  const returnTo = Array.isArray(raw) ? raw[0] : raw;
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/dashboard";
  }
  return returnTo;
}

export function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("local@barakah.dev");
  const [password, setPassword] = useState("03182927392");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
            email,
            password,
            returnTo: getReturnTo(router.query),
          }),
        });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Login failed");
      }

      router.replace(data?.redirectTo || "/dashboard");
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
            Use the local demo account to test inventory, sales, zakat, and reporting flows exactly like a real deployment.
          </p>
          <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Demo credentials</p>
            <p className="font-mono text-sm">Email: local@barakah.dev</p>
            <p className="font-mono text-sm">Password: 03182927392</p>
          </div>
        </div>

        <Card className="border-border shadow-2xl shadow-black/20">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full h-11 font-semibold" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
