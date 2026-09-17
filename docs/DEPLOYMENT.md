# Deployment

The canonical deployment guide is [Vercel deployment](./VERCEL_DEPLOYMENT.md). This file remains as
a short release checklist.

## Required Local Checks

```bash
npm install
npm run typecheck
npm run test
npm run lint
npm run build
npm audit
```

## Required Environment Variables

Set these on the deployment host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Optional:

- `MICROLINK_API_KEY`

`SUPABASE_SECRET_KEY` is server-only. Do not set secret, service-role, Google client secret, or other
private API keys with `VITE_` prefixes.

## Vercel Notes

WishList is a TanStack Start/Nitro app. Production builds use Nitro's `vercel` preset in
`vite.config.ts`, which emits Vercel Build Output API files under `.vercel/output`.

Recommended Vercel project settings:

- Framework preset: TanStack Start if detected; otherwise Vite/Other.
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave empty/default.
