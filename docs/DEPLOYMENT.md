# Deployment

## Required Build

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

## Environment Variables

Set these on the deployment host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROJECT_ID` for Lovable compatibility if needed
- `SUPABASE_SECRET_KEY` if account deletion should work
- `SUPABASE_SERVICE_ROLE_KEY` only as a deprecated legacy fallback

Do not set secret, service-role, or other private API keys with `VITE_` prefixes.

## Vercel Notes

The source is a TanStack Start/Nitro app. Normal production builds are pinned to Nitro's `vercel` preset in `vite.config.ts`, which emits Vercel Build Output API files under `.vercel/output`. Lovable sandbox builds may still force their own Cloudflare output internally.

Recommended Vercel project settings:

- Framework preset: Other, Vite, or TanStack Start if offered by the dashboard.
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave empty/default so Vercel can use `.vercel/output`.

## Manual External Setup

1. Create or choose a Supabase project.
2. Run migrations from `supabase/migrations`.
3. Configure Auth providers and redirect URLs.
4. Confirm the private `item-images` bucket exists.
5. Add environment variables to the hosting provider.
6. Run the verification commands above.
