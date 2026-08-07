# AspireList

A personal acquisition dashboard: save anything you want from a link, plan how you'll get it, and keep a record of what you achieved.

## Stack

- React 19 + TypeScript, Vite 7, TanStack Start / Router / Query
- Tailwind CSS v4 (`src/styles.css`) with shadcn/ui components
- Postgres + Auth + Storage backend (Supabase-compatible), accessed via the generated client in `src/integrations/supabase/`

## Scripts

```bash
bun install
bun run dev      # local dev server on :8080
bun run build    # production build
bun run lint     # eslint + prettier rules
bun run test     # vitest unit tests
```

## Environment

Copy `.env.example` to `.env` and set your local values. Do not commit `.env`; it is ignored by git.

Copy the values below into `.env` (client-visible) and your host's server env:

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Public API key |
| `SUPABASE_URL` | server | Same URL, for SSR + server functions |
| `SUPABASE_PUBLISHABLE_KEY` | server | Same public key |
| `SUPABASE_SERVICE_ROLE_KEY` | server (optional) | Privileged maintenance only |

## Data model

`profiles`, `categories`, `collections`, `items`, `item_collections`, `item_images`, `price_history`, `extraction_logs`.
Every table has row-level security scoped to `auth.uid()`, so each account only ever reads and writes its own rows.
A signup trigger creates the profile row and seeds default categories.

Uploaded item photos live in the private `item-images` storage bucket under `<user id>/<item id>/…` and are read through short-lived signed URLs.

## URL extraction

`src/lib/extract.server.ts` fetches the product page server-side (with SSRF protection and size limits) and layers JSON-LD → Open Graph → HTML meta parsing with a confidence score.
It is exposed through the authenticated server function in `src/lib/extract.functions.ts`; every attempt is logged to `extraction_logs`.
Manual entry is always available when a site blocks extraction, and item detail offers a re-check that shows a field-by-field diff before you accept it.

## Portability

Settings → Your data exports a versioned JSON backup of every row you own and can import it back into any AspireList instance.
No vendor-specific edge functions are used: all server logic is TanStack Start server functions, so the app can be deployed to any Node/edge host with the env vars above.
