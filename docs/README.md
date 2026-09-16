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
src/lib/extraction/      Provider-based URL extraction, merge policy, image import, and field labels
src/lib/                 Domain helpers, queries, backup/import, account functions, and utilities
src/routes/              TanStack Router routes; generated route shape should stay route-driven
supabase/migrations/     Database, RLS, trigger, and storage setup
docs/                    Architecture, setup, deployment, and operational notes
```

## Extraction Notes

Product extraction is link-first and provider-based. The native WishList extractor runs first using
public page metadata: structured data, Open Graph, Twitter cards, schema.org item properties,
canonical links, and selected product-image hints. If native extraction is blocked or too sparse,
WishList may make one bounded server-side Microlink metadata request as an optional browser-backed
fallback. The app must still work when that fallback is unavailable or quota-limited.

Image extraction keeps a ranked candidate list. WishList tries a small number of candidates for
private Supabase Storage import and falls back to the remote image URL or product placeholder when
storage import is blocked, unsupported, or too large.

Extraction remains best-effort. CAPTCHA, login-required pages, JavaScript-only product content,
rate limits, and anti-bot/CDN blocking can still prevent automatic details or image import.
