import type { Metadata } from "next";
import { Salesmen } from "@/views/salesmen";

export const metadata: Metadata = {
  title: "Salesmen",
  description: "Manage targets, commissions, and sales team performance.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SalesmenPage() {
  return <Salesmen />;
}
