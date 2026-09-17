# Vercel Deployment

WishList builds as a TanStack Start app through Vite and Nitro. `vite.config.ts` pins Nitro's
`vercel` preset, which emits Vercel Build Output API files under `.vercel/output`.

## Import The Repository

1. Sign in to Vercel.
2. Choose **Add New Project**.
3. Import your GitHub repository.
4. Select branch `main`.
5. Use repository root as the root directory.

## Build Settings

- Framework: TanStack Start if detected; otherwise use the closest current Vercel-supported option
  such as Vite/Other.
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default/empty because Nitro produces Vercel Build Output API output.

## Environment Variables

Add these to Production and Preview:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Optional:

```text
MICROLINK_API_KEY
```

`SUPABASE_SECRET_KEY` is server-only. Never create `VITE_SUPABASE_SECRET_KEY`.

## First Deployment

Deploy the project. After a successful deployment Vercel gives you a domain like:

```text
https://your-wishlist.vercel.app
```

Do not type a Supabase wildcard into the browser. The browser URL is the plain production domain.

## Update Supabase After Deployment

Go to:

```text
Supabase -> Authentication -> URL Configuration
```

Set:

```text
Site URL: https://YOUR_PRODUCTION_DOMAIN
Allowed redirects:
https://YOUR_PRODUCTION_DOMAIN/**
http://localhost:5173/**
```

The `/**` wildcard belongs only in Supabase redirect patterns.

## Update Google OAuth After Deployment

Only if using Google OAuth, go to:

```text
Google Cloud -> Google Auth Platform -> OAuth Client
```

Authorized JavaScript origins:

```text
http://localhost:5173
https://YOUR_PRODUCTION_DOMAIN
```

Authorized redirect URI remains:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Then confirm Supabase's Google provider still has the correct Client ID and Client Secret.
