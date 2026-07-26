# Barakah ERP Frontend

Next.js frontend for Barakah ERP.

## Run Locally

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_TARGET`
- `NEXT_PUBLIC_SITE_URL`

```bash
npm install
npm run dev
```

The app runs on:

- `http://localhost:3000`

## Build

```bash
npm run build
```

## Type Check

```bash
npm run typecheck
```

## Structure

- `app/` route entrypoints
- `src/` shared UI, pages, layout, and components
- `lib/api-client-react/` generated API client
- `lib/auth-web/` local auth helper
- `assets/` local copied static assets

## Notes

- Frontend talks to the backend through Next.js rewrites on `/api/*`.
- The landing page login button opens `/login`, where the local demo account submits a real `POST /api/auth/login` request with email/password.
- Production should set `NEXT_PUBLIC_API_TARGET` to the deployed backend URL so the frontend never falls back to localhost.
- The current UI matches the existing Barakah ERP look and behavior.
- Supports English and Urdu (RTL) via `src/lib/i18n.tsx`; the sidebar and layout flip direction automatically in Urdu.
- Pages: Dashboard, Inventory (with bulk bill upload/OCR), Sales (multi-item, PDF bill download), Bills (purchase/supplier bills), Reports, Salesmen, Suppliers, Zakat, Settings, Subscription.
- Bill OCR (`src/lib/bill-ocr.ts`) runs entirely client-side (tesseract.js for images, pdfjs-dist for PDFs) — no server-side OCR dependency or API key required.
- Restricted/paused-subscription tenants stay read-only: `components/subscription-guard.tsx` shows a persistent banner and periodic reminder while still letting the user view their data.
