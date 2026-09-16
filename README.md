# WishList

WishList is a private, cross-store wishlist and purchase planning application. Save items manually
or from product URLs, organize them into categories and collections, track savings, and keep a
record of what you eventually buy.

This repository contains the current codebase as it exists today. It was originally generated with
outside tooling and has since been made portable around TanStack Start, Vite, Vercel, and Supabase.

## Features

- Save products from different stores with editable extracted details.
- Use a native-first, optional-fallback metadata pipeline for link-first product saving.
- Preview extracted product details before saving.
- Track source URLs, canonical URLs, prices, ratings, availability, and product images.
- Organize items with categories and many-to-many collections.
- Track target budgets, amount saved, target purchase dates, and purchase reflections.
- Keep active, purchased, rejected, archived, and deleted states distinct.
- Upload or import item images into private Supabase Storage.
- Export user data as JSON backup or CSV item lists.
- Restore backups with merge or replace modes.

## Screenshots

Screenshots are not committed yet. Add production screenshots here before a public launch if you
want a visual preview on GitHub.

## Tech Stack

- React 19 and TypeScript
- TanStack Start, TanStack Router, and TanStack Query
- Vite 8 with Tailwind CSS v4
- Nitro with the Vercel preset
- Supabase Auth, Postgres, and private Storage
- Vitest, jsdom, and React Testing Library

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set real local values in `.env.local`. Never commit `.env` or `.env.local`.

## Environment Variables

Public frontend variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Server-only variables:

```bash
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
MICROLINK_API_KEY= # optional; server-only, not required
```

`SUPABASE_SECRET_KEY` must be an `sb_secret_...` key from the Supabase dashboard and must never use
a `VITE_` prefix. `SUPABASE_SERVICE_ROLE_KEY` is supported only as a deprecated local fallback while
migrating older deployments.

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password auth.
3. Configure Google OAuth in Supabase Auth if you want Google sign-in.
4. Run the SQL migrations in `supabase/migrations` in timestamp order.
5. Confirm the private `item-images` bucket exists with the policies from the migrations.
6. Add the environment variables above to `.env.local` and to your deployment provider.

## Apply Migrations

Use the Supabase CLI or SQL editor to apply files from `supabase/migrations`. Keep schema changes
reproducible by adding new migration files instead of editing already-applied migrations.

## Google OAuth Setup

WishList uses `supabase.auth.signInWithOAuth({ provider: "google" })` directly. Configure Google in
Supabase Auth, then add local and production redirect URLs:

- `http://localhost:8080`
- Your Vercel preview and production URLs

## Storage Setup

The app uses a private Supabase Storage bucket named `item-images`. Paths are scoped as:

```text
<auth user id>/<item id>/<filename>
```

Storage policies should allow authenticated users to access only paths whose first folder segment
matches their user ID.

## Development Commands

```bash
npm run dev
npm run typecheck
npm run test
npm run lint
npm run build
npm run preview
```

## Testing

Run:

```bash
npm run test
```

Tests cover domain helpers, backup validation, item payload behavior, provider-based product
metadata extraction, fallback merge behavior, ranked product image candidates, retry behavior, and
remote image import validation.

## Vercel Deployment

Use these Vercel settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave empty/default
- Framework preset: Other, Vite, or TanStack Start if available

The build emits Vercel Build Output API files under `.vercel/output`.

## Security Notes

- Public browser code may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SECRET_KEY` is server-only and powers privileged account deletion.
- User-owned tables use Row Level Security.
- Item images live in private storage paths scoped by authenticated user ID.
- Product extraction and remote image import validate URLs and reject private/internal targets.
- Microlink fallback, when used, receives only the public product URL and never receives Supabase,
  Google, or session credentials.
- Extraction is best-effort; CAPTCHA, login walls, JavaScript-only product content, rate limits,
  and anti-bot/CDN blocking can still require manual entry.
- JSON import rewrites ownership to the current signed-in user.

## Backup And Export

New JSON exports use the `wishlist-backup` format. Imports also accept the old
`aspirelist-backup` format so existing users can restore older files. CSV export includes useful
item fields for spreadsheet use.

## Project Structure

```text
src/components/          Shared UI and app shell
src/integrations/        Supabase clients and auth middleware
src/lib/extraction/      Product extraction, extraction server functions, and image import
src/lib/                 Domain helpers, images, backup/import, queries, and utilities
src/routes/              TanStack Router routes
supabase/migrations/     Database, RLS, trigger, and storage setup
docs/                    Architecture and deployment notes
```

## Contributing

See `CONTRIBUTING.md`.

## License

MIT. See `LICENSE`.

## Author

**Yellanki Kaushik**

GitHub: [https://github.com/YellankiKaushik](https://github.com/YellankiKaushik)
