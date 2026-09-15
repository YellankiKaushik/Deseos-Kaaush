# Auth Setup

AspireList currently uses Supabase Auth.

## Email and Password

Enable email/password signups in Supabase Auth. The app calls:

- `supabase.auth.signUp`
- `supabase.auth.signInWithPassword`
- `supabase.auth.getUser`
- `supabase.auth.getSession`
- `supabase.auth.signOut`

The signup trigger creates the matching `profiles` row and default categories.

## Google OAuth

Google OAuth is currently implemented through Lovable Cloud Auth in `src/integrations/lovable/index.ts`, then the returned tokens are passed to Supabase with `supabase.auth.setSession`.

To use Google OAuth outside Lovable, configure Google as an OAuth provider in Supabase Auth and replace the Lovable wrapper with direct Supabase OAuth sign-in.

## Redirect URLs

Configure local and production redirect URLs in Supabase Auth:

- Local: `http://localhost:8080`
- Production: your deployed app URL

## Account Deletion

Account deletion is server-side only through `src/lib/account.functions.ts`. It requires `SUPABASE_SERVICE_ROLE_KEY` on the server and deletes the authenticated user ID determined by middleware. Do not expose this key through `VITE_*`.
