# Barakah ERP Frontend

React + Vite frontend for Barakah ERP.

## Run Locally

```bash
npm install
npm run dev
```

The app runs on:
- `http://localhost:5173`

## Build

```bash
npm run build
```

## Type Check

```bash
npm run typecheck
```

## Structure

- `src/` app UI, pages, layout, and components
- `lib/api-client-react/` generated API client
- `lib/auth-web/` local auth helper
- `assets/` local copied static assets

## Notes

- Frontend talks to the backend via `/api` proxy in Vite dev mode.
- The landing page login button now opens `/login`, where the local demo account submits a real `POST /api/login` request with email/password.
- The current UI matches the existing Barakah ERP look and behavior.
