# WishList Documentation

Start here for project maintenance:

- [Architecture](./ARCHITECTURE.md)
- [Auth setup](./AUTH_SETUP.md)
- [Database setup](./DATABASE_SETUP.md)
- [Storage setup](./STORAGE_SETUP.md)
- [Deployment](./DEPLOYMENT.md)

## Current Repository Structure

```text
src/components/          Shared UI, app shell, item UI, image UI, and navigation helpers
src/components/ui/       shadcn-style primitive components; keep these in place
src/integrations/        Supabase client and authenticated server middleware
src/lib/extraction/      URL extraction, extraction server functions, image import, and field labels
src/lib/                 Domain helpers, queries, backup/import, account functions, and utilities
src/routes/              TanStack Router routes; generated route shape should stay route-driven
supabase/migrations/     Database, RLS, trigger, and storage setup
docs/                    Architecture, setup, deployment, and operational notes
```

## Extraction Notes

Product extraction uses public page metadata only. It reads structured data, Open Graph, Twitter
cards, schema.org item properties, canonical links, and selected product-image hints. It does not
use paid scraping services, AI APIs, browser automation, or commercial product data APIs.

Extraction remains best-effort. CAPTCHA, login-required pages, JavaScript-only product content,
rate limits, and anti-bot/CDN blocking can still prevent automatic details or image import.
