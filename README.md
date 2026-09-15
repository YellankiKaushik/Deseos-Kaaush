# AspireList

AspireList is a private personal wishlist and purchase-planning app. Save items manually or from a product URL, organize them by category and collection, track savings and purchase state, and export or restore your own data.

## Current Stack

- React 19, TypeScript, TanStack Start, TanStack Router, TanStack Query
- Vite through `@lovable.dev/vite-tanstack-config`
- Tailwind CSS v4 and shadcn/Radix UI components
- Supabase-compatible Postgres, Auth, and private Storage
- Vitest, jsdom, and React Testing Library

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set the Supabase values in `.env`. The browser may use only the `VITE_SUPABASE_*` public values. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

## Environment Variables

| Variable                        | Scope           | Purpose                                           |
| ------------------------------- | --------------- | ------------------------------------------------- |
| `VITE_SUPABASE_URL`             | frontend public | Supabase project API URL                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | frontend public | Supabase publishable/anon key                     |
| `VITE_SUPABASE_PROJECT_ID`      | frontend public | Lovable compatibility/project metadata            |
| `SUPABASE_URL`                  | server          | Supabase project API URL for server functions     |
| `SUPABASE_PUBLISHABLE_KEY`      | server          | Public key used by authenticated server functions |
| `SUPABASE_SERVICE_ROLE_KEY`     | server secret   | Account deletion and privileged maintenance only  |
| `SUPABASE_PROJECT_ID`           | optional        | Lovable compatibility/project metadata            |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database setup](docs/DATABASE_SETUP.md)
- [Auth setup](docs/AUTH_SETUP.md)
- [Storage setup](docs/STORAGE_SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Lovable to Supabase migration](docs/LOVABLE_TO_SUPABASE_MIGRATION.md)

## Security Notes

Every user-owned table has RLS enabled and policies scoped to `auth.uid()`. Additional triggers prevent cross-user category, collection, image, price-history, and extraction-log relationships. Uploaded item images live in the private `item-images` bucket under `<user id>/<item id>/...` and are loaded with signed URLs.

The app does not require paid scraping APIs or AI providers.
