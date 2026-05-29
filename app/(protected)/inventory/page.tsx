import type { Metadata } from "next";
import { Inventory } from "@/views/inventory";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage products, stock, and supplier movement.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InventoryPage() {
  return <Inventory />;
}
