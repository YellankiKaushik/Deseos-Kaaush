# Contributing

Thanks for helping improve WishList.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use a feature branch for changes. Keep commits focused and avoid rewriting published history.

## Before A Pull Request

Run:

```bash
npm install
npm run typecheck
npm run test
npm run lint
npm run build
npm audit
```

Fix errors before opening a pull request. Existing lint warnings should be understood and called out
if they remain.

## Database Changes

Add Supabase schema changes as new migration files under `supabase/migrations`. Do not edit
already-applied migrations unless the repository has not published them yet and the maintainer asks
for it.

Never manually modify an already-applied production schema and then leave the repository without a
matching migration.

## Secrets

Never commit `.env`, `.env.local`, service-role JWTs, `sb_secret_...` keys, database passwords,
OAuth client secrets, or provider tokens. Use `.env.example` for blank variable names only.
