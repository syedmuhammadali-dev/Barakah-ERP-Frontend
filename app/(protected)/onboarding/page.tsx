import type { Metadata } from "next";
import { Onboarding } from "@/views/onboarding";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Complete business setup and start using Barakah ERP.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  return <Onboarding />;
}
