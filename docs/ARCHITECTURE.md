# Architecture

WishList is a TanStack Start application using the current codebase architecture.

## Frontend

- `src/routes` contains TanStack Router file routes.
- `src/components` contains the app shell, item forms, item image UI, cards, and Radix UI primitives.
- `src/lib/wishlist.ts` contains domain helpers for status labels, sorting, savings progress, URL normalization, and currency totals.
- `src/lib/queries.ts` contains shared Supabase reads and user-data export.

## Backend

- Supabase Postgres stores application data.
- Supabase Auth handles email/password sessions and Google OAuth.
- Product URL extraction runs as a TanStack Start server function in `src/lib/extraction/extract.functions.ts`.
- `src/lib/extraction/extract.server.ts` orchestrates a provider pipeline. The native provider in `native-provider.server.ts` always runs first and parses JSON-LD Product data, Open Graph, Twitter cards, schema.org metadata, HTML metadata, and product-page heuristics while preserving SSRF, redirect, timeout, and response-size protections.
- `microlink-provider.server.ts` is an optional browser-backed fallback for blocked or insufficient native results. It uses the free Microlink endpoint without requiring an API key; `MICROLINK_API_KEY` may be supplied later as a server-only variable.
- `merge-results.ts` deterministically merges providers, preserving native structured prices, currency, ratings, reviews, and availability while using fallback metadata for missing product title, description, store, and image candidates.
- Remote image validation and private-storage import live in `src/lib/extraction/image-import.server.ts`.
- Secure auth-account deletion is implemented as a server function in `src/lib/account.functions.ts` and requires `SUPABASE_SECRET_KEY`, with `SUPABASE_SERVICE_ROLE_KEY` supported only as a deprecated legacy fallback.

## Storage

Images use the private Supabase Storage bucket `item-images`.
Paths are scoped as `<user id>/<item id>/<filename>`.
The browser uploads through the authenticated Supabase client and reads images through signed URLs.
Remote image import runs server-side through authenticated server functions.

## Deployment Shape

The Vite config uses native Vite plugins for React, Tailwind CSS, TanStack Start, and Nitro.
Production builds use Nitro's Vercel preset and emit Vercel Build Output API files under
`.vercel/output`.
