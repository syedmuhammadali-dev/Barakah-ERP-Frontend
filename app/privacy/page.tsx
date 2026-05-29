import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how Barakah ERP handles privacy and data protection.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Barakah ERP</p>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">
            This page explains how Barakah ERP handles user and business data.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6 leading-relaxed text-sm text-muted-foreground">
            <p>
              We only use the information needed to operate your ERP account,
              sync business data, and provide product support.
            </p>
            <p>
              Authentication cookies, business records, and generated reports
              are stored to keep your workspace available across sessions.
            </p>
            <p>
              We do not sell customer data. Access is limited to the account
              owner and authorized application services.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-start">
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
