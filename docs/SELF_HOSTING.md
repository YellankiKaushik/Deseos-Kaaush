# Self-host WishList

WishList is designed to run on infrastructure you own. A self-hosted installation uses your own
GitHub repository, your own Supabase project, your own Vercel project, and optional Google OAuth
credentials that you create. It does not need the original maintainer's Vercel, Supabase, or Google
Cloud configuration.

```text
Browser
  |
  v
Vercel-hosted WishList
  |
  v
Supabase Auth + PostgreSQL + private Storage

Optional: Microlink metadata fallback for product URL extraction
```

## Prerequisites

- GitHub account.
- Supabase account.
- Vercel account.
- Google account only if you want Google OAuth login.
- Node.js current active LTS compatible with this project and npm.
- Git.

Email/password authentication works without Google OAuth. Google OAuth and Microlink are optional.
Normal personal use should fit typical free-tier limits, but provider pricing and limits can change;
check Supabase, Vercel, Google, and Microlink before depending on a plan.

## Recommended Setup Order

1. Fork or clone the repository.
2. Run `npm install`.
3. Create a Supabase project.
4. Configure `.env.local`.
5. Link the Supabase CLI.
6. Dry-run migrations.
7. Push migrations.
8. Run locally.
9. Test email authentication.
10. Optionally configure Google OAuth.
11. Import the GitHub repository into Vercel.
12. Add Vercel environment variables.
13. Deploy.
14. Update Supabase production URL.
15. Update Google authorized origin if using Google OAuth.
16. Run production tests.
17. Run the second-user security test.

Do not configure final production OAuth URLs before Vercel assigns the production domain.

## Fork Or Clone

Path A: fork on GitHub, then clone your fork.

```bash
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
cd <YOUR_REPOSITORY>
npm install
```

Path B: clone directly.

```bash
git clone https://github.com/<SOURCE_OWNER>/<SOURCE_REPOSITORY>.git
cd <SOURCE_REPOSITORY>
npm install
```

## Create A Supabase Project

1. Sign in to Supabase.
2. Create or select an organization.
3. Choose **New Project**.
4. Enter a project name.
5. Create a strong database password.
6. Choose the region closest to you or your users.
7. Wait for provisioning to finish.

Keep the database password private. Do not commit it, paste it into screenshots, or add it to any
public issue or chat.

## Supabase API Keys

In the Supabase dashboard, collect:

- Project URL: `https://YOUR_PROJECT_REF.supabase.co`
- Publishable key: `YOUR_PUBLISHABLE_KEY`
- Secret server key: `YOUR_SECRET_KEY`

Modern Supabase keys usually start with:

- `sb_publishable_...`: safe for browser use when Row Level Security is correctly configured.
- `sb_secret_...`: server-only and powerful. Never put it in a `VITE_` variable and never commit it.

Legacy `anon` and `service_role` JWT keys may appear in older Supabase dashboards or older
deployments. Prefer the modern publishable and secret keys. WishList still supports
`SUPABASE_SERVICE_ROLE_KEY` only as a deprecated server-side fallback for older local environments.

## Configure `.env.local`

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in your own values:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY

MICROLINK_API_KEY=
```

`.env.local` is ignored by Git. Never paste real secrets into README files, GitHub issues, commits,
screenshots, or public chats.

## Install And Link The Supabase CLI

The repository includes Supabase as a development dependency. If you need to add it again:

```bash
npm install supabase --save-dev
```

Sign in and link your project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Find `YOUR_PROJECT_REF` in your Supabase project URL:

```text
https://YOUR_PROJECT_REF.supabase.co
```

If the CLI reports IPv6 connection problems, follow the CLI message to use the IPv4-supported
connection flow, then retry the link or migration command.

## Apply Database Migrations

Do not manually recreate tables in the dashboard if migrations already define them.

Check migration state first:

```bash
npx supabase migration list
```

Dry-run the remote change:

```bash
npx supabase db push --dry-run
```

The dry run should list the WishList migrations from `supabase/migrations`.

Apply the migrations:

```bash
npx supabase db push
```

Verify the local and remote migration versions match:

```bash
npx supabase migration list
```

Avoid random production schema edits in the Supabase dashboard. Add future schema changes as new
migration files instead of editing already-applied migrations.

## Database Tables

Current migrations create and maintain these application tables:

- `profiles`: one row per auth user; display name, avatar URL, default currency, dashboard view,
  and theme.
- `categories`: user-owned categories with optional icons.
- `collections`: user-owned groups with descriptions, cover images, target dates, budgets, and
  ordering.
- `items`: user-owned wishlist records, product URLs, prices, category links, lifecycle status,
  savings fields, extraction metadata, purchase fields, archive flag, and image pointers.
- `item_collections`: many-to-many joins between user-owned items and collections.
- `item_images`: metadata for uploaded or imported item images.
- `price_history`: item price snapshots.
- `extraction_logs`: product extraction attempts and provider observability.

All public application tables use Row Level Security. Authenticated users can access only rows that
belong to their own auth user id. Relationship triggers prevent linking an item, collection,
category, image, price row, or extraction log across users.

## Storage Setup

Migrations create or update one private Supabase Storage bucket:

```text
item-images
```

The bucket is configured as private with a 10 MB file size limit and allowed MIME types:

- `image/jpeg`
- `image/png`
- `image/webp`

WishList stores uploaded images under per-user, per-item paths:

```text
<auth user id>/<item id>/<timestamp>.<ext>
```

Storage policies allow authenticated users to access only objects whose first path segment matches
their auth user id. The browser displays private images through signed URLs. Remote image import
tries to copy public product images into this bucket when possible.

After migrations, verify the bucket in Supabase:

```text
Supabase -> Storage -> item-images
```

## Email And Password Auth

Supabase email/password auth is built in.

In Supabase:

```text
Authentication -> Providers / Sign In Providers -> Email
```

Enable email signups and choose your confirmation behavior. If confirmations are enabled, test the
email link flow before production use.

For local development, this repo uses Vite's default dev URL unless your terminal prints another
port:

```text
Site URL: http://localhost:5173
Allowed Redirect URL: http://localhost:5173/**
```

## Run Locally

```bash
npm run dev
```

Expected local URL:

```text
http://localhost:5173
```

If Vite reports a different URL, use that URL in your browser and Supabase local redirect settings.

Test:

- Landing page loads.
- Create an account.
- Confirm email if enabled.
- Log in.
- Open the dashboard.
- Log out.
- Log in again.

## Optional Google OAuth

WishList works without Google OAuth. For Google login, follow
[Google OAuth setup](./GOOGLE_OAUTH_SETUP.md).

Architecture:

```text
WishList -> Supabase Auth -> Google -> Supabase callback -> WishList
```

Google Client ID and Client Secret are entered into Supabase, not into WishList browser environment
variables.

## Vercel Deployment

Follow [Vercel deployment](./VERCEL_DEPLOYMENT.md). Required Vercel variables are:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Optional:

- `MICROLINK_API_KEY`

`SUPABASE_SECRET_KEY` is server-only. Never create `VITE_SUPABASE_SECRET_KEY`.

After deployment, Vercel gives you a domain like:

```text
https://your-wishlist.vercel.app
```

## Update Supabase Auth After Deployment

After Vercel gives the real URL, go to:

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

The `/**` wildcard belongs only in Supabase redirect patterns. The actual browser URL is:

```text
https://YOUR_PRODUCTION_DOMAIN
```

It is not:

```text
https://YOUR_PRODUCTION_DOMAIN/**
```

## Product Extraction

WishList product URL extraction is best-effort. It currently uses:

1. Native structured metadata extraction.
2. Optional browser-backed metadata fallback where configured.
3. Image candidate ranking.
4. Remote image import into Supabase Storage when possible.

It cannot guarantee every ecommerce site will work. Common limitations include CAPTCHA,
authentication or login walls, hard bot blocking, JavaScript-only content, rate limits, protected
CDNs, and missing public metadata. Manual item editing remains the universal fallback.

## Optional Microlink Setup

WishList can call Microlink without an API key for unauthenticated requests. That can be enough for
light personal use when the endpoint permits it. `MICROLINK_API_KEY` is optional and server-only; add
it in `.env.local` and Vercel only if you choose to use a Microlink plan.

Do not assume a fixed permanent free quota. Check Microlink's current pricing and limits.

## Production Verification

Use [Post-deploy checklist](./POST_DEPLOY_CHECKLIST.md) before trusting the installation.

## Mandatory Second-user Security Test

Before production use, create two separate users.

User A:

- Create an item.
- Create a collection.
- Upload or import an image.
- Add any purchase or price information you want to test.
- Log out.

User B:

- Sign in.
- Confirm User B sees none of User A's items, categories, collections, images, price history, or
  purchase information.
- Copy a User A item URL while logged in as User A.
- Log in as User B and paste that URL manually.
- Confirm User B cannot read User A's private record.

Google OAuth does not replace this test. RLS and storage policies provide data isolation.

## Troubleshooting

See [Troubleshooting](./TROUBLESHOOTING.md).
