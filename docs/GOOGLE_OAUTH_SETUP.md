# Google OAuth Setup

Google OAuth is optional. WishList works with email/password authentication alone.

## How Google Login Flows

```text
WishList -> Supabase Auth -> Google -> Supabase callback -> WishList
```

The OAuth callback belongs to Supabase, not Vercel:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

## Create A Google OAuth Client

1. Go to Google Cloud Console.
2. Create a new Google Cloud project for your WishList installation.
3. Open Google Auth Platform.
4. Configure branding.
5. Use app name `WishList`.
6. Choose audience `External` for a personal external app.
7. Configure developer and support email addresses.
8. Add only basic identity scopes:
   - `openid`
   - `email`
   - `profile`
9. Create an OAuth Client.
10. Choose application type `Web application`.

## Local URLs

Authorized JavaScript origins:

```text
http://localhost:5173
```

Authorized redirect URI:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

If Vite prints a different local port, use that port instead of `5173`.

## Production URLs

After Vercel gives you the production URL, add it to Google:

Authorized JavaScript origins:

```text
http://localhost:5173
https://YOUR_PRODUCTION_DOMAIN
```

Authorized redirect URI remains:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

The Supabase callback does not change when the Vercel URL changes.

## Configure Supabase

In Supabase:

```text
Authentication -> Providers -> Google
```

Enable Google and paste:

- Google Client ID.
- Google Client Secret.

The Google Client Secret belongs only in Supabase's provider settings. It does not belong in
WishList `.env.local`, Vercel browser variables, README files, commits, screenshots, or public
support threads.
