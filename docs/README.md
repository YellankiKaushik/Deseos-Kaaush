# WishList Documentation

Start here:

- [Self-host WishList](./SELF_HOSTING.md)
- [Google OAuth setup](./GOOGLE_OAUTH_SETUP.md)
- [Vercel deployment](./VERCEL_DEPLOYMENT.md)
- [Post-deploy checklist](./POST_DEPLOY_CHECKLIST.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Owner teardown checklist](./OWNER_TEARDOWN_CHECKLIST.md)

Supporting references:

- [Architecture](./ARCHITECTURE.md)
- [Auth setup](./AUTH_SETUP.md)
- [Database setup](./DATABASE_SETUP.md)
- [Storage setup](./STORAGE_SETUP.md)
- [Deployment](./DEPLOYMENT.md)

The self-hosting guide is the canonical setup path. Older focused files remain for quick reference
and should not contradict the canonical guide.

## Current Repository Structure

```text
src/components/          Shared UI, app shell, item UI, image UI, and navigation helpers
src/components/ui/       shadcn-style primitive components
src/integrations/        Supabase client and authenticated server middleware
src/lib/extraction/      Provider-based URL extraction, merge policy, image import, and labels
src/lib/                 Domain helpers, queries, backup/import, account functions, and utilities
src/routes/              TanStack Router routes
supabase/migrations/     Database, RLS, trigger, and storage setup
docs/                    Self-hosting, architecture, setup, deployment, and operational notes
```
