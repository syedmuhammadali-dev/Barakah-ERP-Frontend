import type { Metadata } from "next";
import { Providers } from "./providers";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "../src/index.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Pakistan-first ERP for inventory, sales, zakat, and retail operations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description:
      "Pakistan-first ERP for inventory, sales, zakat, and retail operations.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Pakistan-first ERP for inventory, sales, zakat, and retail operations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
