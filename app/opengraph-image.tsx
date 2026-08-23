import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";
export const alt = `${SITE_NAME} — Pakistan-first ERP for retail, inventory, sales, and Zakat`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0B0B1A",
          backgroundImage:
            "radial-gradient(circle at 85% 25%, rgba(245,158,11,0.25), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 18,
              background: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 800,
              color: "#0B0B1A",
            }}
          >
            B
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: -1,
            }}
          >
            {SITE_NAME}
          </div>
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#F5F5F5",
            maxWidth: 920,
            lineHeight: 1.3,
          }}
        >
          Built for Modern Retailers &amp; Businesses in Pakistan
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: "#C7C7D1",
            maxWidth: 920,
          }}
        >
          Inventory · Sales · Mechanic Bills · Zakat · Suppliers — all in one bilingual ERP.
        </div>
      </div>
    ),
    { ...size },
  );
}
