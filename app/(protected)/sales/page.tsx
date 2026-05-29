import type { Metadata } from "next";
import { Sales } from "@/views/sales";

export const metadata: Metadata = {
  title: "Sales",
  description: "Create sales, manage invoices, and track transactions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SalesPage() {
  return <Sales />;
}
