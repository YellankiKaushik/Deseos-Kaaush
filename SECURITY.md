# Security Policy

## Reporting Vulnerabilities

Please report security issues privately to the maintainer before publishing details. If GitHub
private vulnerability reporting is enabled for this repository, use that. Otherwise contact
Yellanki Kaushik through GitHub:

[https://github.com/YellankiKaushik](https://github.com/YellankiKaushik)

## Environment Safety

- Never commit `.env` or `.env.local`.
- Browser code may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SECRET_KEY` must stay server-only and must never use a `VITE_` prefix.
- Never commit Google Client Secrets, database passwords, access tokens, GitHub tokens, or bearer
  tokens.
- Legacy service-role JWTs should be replaced with `sb_secret_...` keys.

## Supabase Expectations

- Enable Row Level Security on user-owned tables.
- Scope user-owned rows with authenticated user ownership checks.
- Keep private storage paths under the authenticated user's ID.
- Do not bypass RLS from browser code.
- Keep account deletion and other privileged operations behind server-only code paths.
- Treat `SUPABASE_SECRET_KEY` as privileged because it can bypass RLS.
- Keep the `item-images` storage bucket private.

## Self-hosting Checks

Before publishing or trusting a deployment, run the post-deploy and second-user security checks in
[docs/POST_DEPLOY_CHECKLIST.md](./docs/POST_DEPLOY_CHECKLIST.md).
