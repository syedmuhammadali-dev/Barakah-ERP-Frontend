import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the terms for using Barakah ERP.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Barakah ERP</p>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">
            These terms explain the rules for using the Barakah ERP platform.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6 leading-relaxed text-sm text-muted-foreground">
            <p>
              Use the platform only for lawful business operations and keep
              account credentials secure.
            </p>
            <p>
              You are responsible for the accuracy of the data you enter,
              including products, sales, supplier balances, and compliance
              records.
            </p>
            <p>
              We may update these terms when the product or legal requirements
              change.
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
