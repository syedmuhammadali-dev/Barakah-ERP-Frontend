import type { Metadata } from "next";
import { Subscription } from "@/views/subscription";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Review the PKR plan and manage payment renewal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubscriptionPage() {
  return <Subscription />;
}
