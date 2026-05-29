import type { Metadata } from "next";
import { Zakat } from "@/views/zakat";

export const metadata: Metadata = {
  title: "Zakat",
  description: "Calculate zakat and monitor Sharia-aligned business assets.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ZakatPage() {
  return <Zakat />;
}
