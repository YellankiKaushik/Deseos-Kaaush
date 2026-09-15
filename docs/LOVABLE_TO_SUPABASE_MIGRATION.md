# Lovable To Supabase Migration

This repository still contains Lovable integration points:

- `.lovable/project.json`
- `@lovable.dev/vite-tanstack-config`
- `@lovable.dev/cloud-auth-js`
- `src/integrations/lovable/index.ts`
- Lovable-compatible env names such as `SUPABASE_PROJECT_ID` and `VITE_SUPABASE_PROJECT_ID`

## Current Backend

The application data model is already Supabase-compatible Postgres with Supabase Auth and Storage. No paid scraping API or AI provider is required.

## Moving To Your Own Supabase Project

1. Create a Supabase project.
2. Copy the API URL and publishable/anon key into `.env`.
3. Run every SQL migration in `supabase/migrations`.
4. Enable email/password Auth.
5. Configure Google OAuth in Supabase if you want to remove the Lovable Cloud Auth wrapper.
6. Add local and production redirect URLs.
7. Confirm the `item-images` bucket and storage policies exist.
8. Deploy with the same env vars on the host.

## Removing Lovable OAuth Later

Replace `lovable.auth.signInWithOAuth("google", ...)` in `src/routes/auth.tsx` with direct Supabase OAuth once Google is configured in Supabase Auth. Keep the provider-specific logic isolated in `src/integrations/lovable/index.ts` or a successor auth module.
