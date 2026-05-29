import type { Metadata } from "next";
import { Settings } from "@/views/settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure store identity, currency, and notifications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <Settings />;
}
