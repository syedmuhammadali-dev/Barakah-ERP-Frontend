import type { Metadata } from "next";
import { Bills } from "@/views/bills";

export const metadata: Metadata = {
  title: "Bills",
  description: "Record supplier purchase bills and restock inventory.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BillsPage() {
  return <Bills />;
}
