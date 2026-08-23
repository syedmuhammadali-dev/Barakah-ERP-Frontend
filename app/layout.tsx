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
  keywords: [
    "ERP Pakistan",
    "retail ERP software",
    "inventory management Pakistan",
    "zakat calculator app",
    "shop management software",
    "sales and billing software",
    "mechanic shop software",
    "Barakah ERP",
  ],
  authors: [{ name: SITE_NAME }],
  icons: {
    icon: "/favicon.svg",
  },
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
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Pakistan-first ERP for inventory, sales, zakat, and retail operations.",
  },
  verification: {
    google: "aAkRFPqsfqlb67JF5wByOAZpg2O_6CKpGpUFQ1fLFRA",
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
