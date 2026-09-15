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
- `SUPABASE_SERVICE_ROLE_KEY` if account deletion should work
- `SUPABASE_PROJECT_ID` for Lovable compatibility if needed

Do not set service-role or private API keys with `VITE_` prefixes.

## Vercel Notes

The source is a TanStack Start/Nitro app, but the current Lovable Vite config builds with a Cloudflare-oriented Nitro preset by default. Before Vercel production deployment, confirm the Nitro preset/output expected by the hosting target or adjust deployment configuration deliberately.

## Manual External Setup

1. Create or choose a Supabase project.
2. Run migrations from `supabase/migrations`.
3. Configure Auth providers and redirect URLs.
4. Confirm the private `item-images` bucket exists.
5. Add environment variables to the hosting provider.
6. Run the verification commands above.
