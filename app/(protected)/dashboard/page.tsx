import type { Metadata } from "next";
import { Dashboard } from "@/views/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Track sales, inventory, and business performance in real time.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <Dashboard />;
}
