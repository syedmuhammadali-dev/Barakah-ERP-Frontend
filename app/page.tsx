import type { Metadata } from "next";
import { Landing } from "@/views/landing";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "Pakistan-first ERP for inventory, sales, zakat, and retail operations. Fast, ethical, and built for real storefronts.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description:
      "Pakistan-first ERP for inventory, sales, zakat, and retail operations.",
    offers: {
      "@type": "Offer",
      price: "10000",
      priceCurrency: "PKR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Landing />
    </>
  );
}
