# Architecture

AspireList is a TanStack Start application generated from Lovable and kept on the existing architecture.

## Frontend

- `src/routes` contains TanStack Router file routes.
- `src/components` contains the app shell, item card/form/image components, and shadcn/Radix primitives.
- `src/lib/aspire.ts` contains domain helpers for status labels, sorting, savings progress, URL normalization, and currency totals.
- `src/lib/queries.ts` contains shared Supabase reads and user-data export.

## Backend

- Supabase-compatible Postgres stores application data.
- Supabase Auth handles email/password sessions.
- Google OAuth is routed through Lovable Cloud Auth in `src/integrations/lovable/index.ts`.
- Product URL extraction runs as a TanStack Start server function in `src/lib/extract.functions.ts` with server-only parsing in `src/lib/extract.server.ts`.
- Secure auth-account deletion is implemented as a server function in `src/lib/account.functions.ts` and requires `SUPABASE_SECRET_KEY`, with `SUPABASE_SERVICE_ROLE_KEY` supported only as a deprecated legacy fallback.

## Storage

Images use the private Supabase Storage bucket `item-images`.
Paths are scoped as `<user id>/<item id>/<timestamp>.<ext>`.
The browser uploads through the authenticated Supabase client and reads images through signed URLs.

## Deployment Shape

The Vite config uses `@lovable.dev/vite-tanstack-config`, which includes TanStack Start, React, Tailwind, path aliases, and Nitro. Normal production builds are pinned to Nitro's Vercel preset, while Lovable sandbox builds may still force Lovable's Cloudflare output internally.
