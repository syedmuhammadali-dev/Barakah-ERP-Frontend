import type { Metadata } from "next";
import { Reports } from "@/views/reports";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review revenue, performance, and business trends.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportsPage() {
  return <Reports />;
}
