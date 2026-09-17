# Architecture

WishList is provider-neutral application code. Each self-hosted installation supplies its own
Supabase project, auth settings, storage bucket, and Vercel deployment.

## Frontend

- React 19 and TypeScript.
- TanStack Start and TanStack Router in `src/routes`.
- TanStack Query for client data workflows.
- Shared UI and app shell in `src/components`.
- Domain helpers in `src/lib/wishlist.ts`.
- Shared Supabase reads and export helpers in `src/lib/queries.ts`.

Browser-visible environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These are public by design. They rely on Row Level Security and storage policies for data
isolation.

## Hosting

WishList is deployed as a Vercel-hosted TanStack Start/Nitro app. `vite.config.ts` uses Nitro's
`vercel` preset, which emits Vercel Build Output API files under `.vercel/output`.

## Data

Supabase PostgreSQL stores profiles, categories, collections, items, item-collection joins,
item-image metadata, price history, and extraction logs. Migrations live in
`supabase/migrations`.

All public application tables enable Row Level Security and scope rows to the authenticated user.
Additional trigger checks prevent cross-user relationship spoofing.

## Authentication

Supabase Auth handles sessions, email/password authentication, and optional Google OAuth. The app
uses Supabase client APIs directly and does not store Google client secrets.

## Storage

Supabase Storage stores item images in one private bucket:

```text
item-images
```

Paths are scoped as:

```text
<auth user id>/<item id>/<filename>
```

The browser uploads through the authenticated Supabase client and reads private images through
signed URLs. Server-side remote image import validates public image URLs before storing copies.

## Server-only Boundaries

Server-only variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `MICROLINK_API_KEY` when configured.

`SUPABASE_SECRET_KEY` must never be exposed with a `VITE_` prefix. It powers privileged server-side
operations such as account deletion and can bypass RLS. `SUPABASE_SERVICE_ROLE_KEY` is supported
only as a deprecated server fallback for older local deployments.

## Product Extraction

Product URL extraction runs as a TanStack Start server function in
`src/lib/extraction/extract.functions.ts`.

- `native-provider.server.ts` parses JSON-LD Product data, Open Graph, Twitter cards, schema.org
  metadata, HTML metadata, and product-page hints while preserving SSRF, redirect, timeout, and
  response-size protections.
- `microlink-provider.server.ts` is an optional browser-backed metadata fallback. It can make
  unauthenticated Microlink requests and may use `MICROLINK_API_KEY` when supplied.
- `merge-results.ts` merges providers deterministically.
- `image-import.server.ts` validates and imports remote images into private storage when possible.

Extraction remains best-effort and manual editing is always available.
