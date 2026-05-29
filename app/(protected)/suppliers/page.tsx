import type { Metadata } from "next";
import { Suppliers } from "@/views/suppliers";

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Track suppliers, balances, and supplier returns.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuppliersPage() {
  return <Suppliers />;
}
