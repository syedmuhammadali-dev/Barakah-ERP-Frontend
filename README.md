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
