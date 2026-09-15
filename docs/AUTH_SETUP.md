# Auth Setup

Wishlist uses Supabase Auth.

## Email And Password

Enable email/password signups in Supabase Auth. The app calls:

- `supabase.auth.signUp`
- `supabase.auth.signInWithPassword`
- `supabase.auth.getUser`
- `supabase.auth.getSession`
- `supabase.auth.signOut`

The signup trigger creates the matching `profiles` row and default categories.

## Google OAuth

Google sign-in uses Supabase directly:

```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin },
});
```

Configure Google as an OAuth provider in Supabase Auth. Do not add another auth provider library for
Google sign-in.

## Redirect URLs

Configure local and production redirect URLs in Supabase Auth:

- Local: `http://localhost:8080`
- Production: your deployed app URL
- Vercel previews: the preview URLs you intend to use

## Account Deletion

Account deletion is server-side only through `src/lib/account.functions.ts`. It requires
`SUPABASE_SECRET_KEY` on the server and deletes the authenticated user ID determined by middleware.
`SUPABASE_SERVICE_ROLE_KEY` is supported only as a deprecated legacy fallback. Do not expose either
key through `VITE_*`.
