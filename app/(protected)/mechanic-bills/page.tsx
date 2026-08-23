import type { Metadata } from "next";
import { MechanicBills } from "@/views/mechanic-bills";

export const metadata: Metadata = {
  title: "Mechanic Bills",
  description: "Create mechanic job cards, track parts and labor, and generate invoices.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MechanicBillsPage() {
  return <MechanicBills />;
}
