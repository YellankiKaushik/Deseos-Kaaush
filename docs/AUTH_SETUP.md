# Auth Setup

The canonical setup path is [Self-host WishList](./SELF_HOSTING.md). This file is a focused auth
reference.

## Email And Password

WishList uses Supabase Auth for email/password signups and logins. In Supabase:

```text
Authentication -> Providers / Sign In Providers -> Email
```

Enable email signups and choose your confirmation behavior. The app calls:

- `supabase.auth.signUp`
- `supabase.auth.signInWithPassword`
- `supabase.auth.getUser`
- `supabase.auth.getSession`
- `supabase.auth.signOut`

The signup trigger creates the matching `profiles` row and default categories.

For local development, this repo uses Vite's default dev URL unless your terminal prints another
port:

```text
Site URL: http://localhost:5173
Allowed Redirect URL: http://localhost:5173/**
```

## Google OAuth

Google OAuth is optional. WishList works without it.

Google sign-in uses Supabase directly:

```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin },
});
```

Configure Google as an OAuth provider in Supabase Auth. Do not add another auth provider library for
Google sign-in. See [Google OAuth setup](./GOOGLE_OAUTH_SETUP.md).

## Production Redirect URLs

After Vercel gives the real production URL, configure Supabase:

```text
Site URL: https://YOUR_PRODUCTION_DOMAIN
Allowed redirects:
https://YOUR_PRODUCTION_DOMAIN/**
http://localhost:5173/**
```

The `/**` wildcard belongs only in Supabase redirect patterns. Do not type it into the browser.

## Account Deletion

Account deletion is server-side only through `src/lib/account.functions.ts`. It requires
`SUPABASE_SECRET_KEY` on the server and deletes the authenticated user ID determined by middleware.
`SUPABASE_SERVICE_ROLE_KEY` is supported only as a deprecated legacy fallback. Do not expose either
key through `VITE_*`.
