# Troubleshooting

## `npm` Says `package.json` Is Missing

Cause: you are in the wrong directory.

Fix:

```bash
cd <YOUR_REPOSITORY>
npm install
```

## Vercel Deployment Not Found

Check for:

- Wrong domain.
- Old renamed project URL.
- `/**` typed into the browser.
- Deployment not assigned to the domain.

`/**` belongs only in Supabase redirect patterns. Your browser should open:

```text
https://YOUR_PRODUCTION_DOMAIN
```

## Google `redirect_uri_mismatch`

The Vercel application origin and Supabase OAuth callback are different values.

Authorized JavaScript origin:

```text
https://YOUR_PRODUCTION_DOMAIN
```

Authorized redirect URI:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

The redirect URI is the Supabase callback because Supabase brokers Google login.

## Supabase Login Works Locally But Not In Production

Check:

- Supabase Site URL.
- Supabase Allowed Redirect URLs.
- Vercel environment variables.
- Whether you redeployed after changing `VITE_*` values.

Browser-visible `VITE_*` variables are baked into the client build, so production needs a redeploy
after changes.

## Product Extraction Has Missing Images

Product extraction is best-effort. Some sites block automated fetches, hotlinking, or CDN access.
CAPTCHA, login walls, JavaScript-only content, rate limits, and missing public metadata can also
limit results. Edit the item manually when extraction cannot read a page.

## Migration List Shows Local Versions But Remote Is Empty

Run:

```bash
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Local and Remote versions should match after a successful push.

## Vercel Build Blocked By Commit Author Identity

Check:

```bash
git config --local user.name
git config --local user.email
```

Use your verified GitHub email or GitHub noreply address. Do not use fake identities such as
`copilot@example.com`.

## CRLF Or Prettier Failures On Windows

This repository includes `.gitattributes` and Prettier settings. Keep source files normalized to LF.
If formatting fails, run:

```bash
npm run format
```

Review the diff before committing.

## Supabase CLI IPv6 Warning

If the Supabase CLI reports IPv6 connection problems, follow the CLI-provided IPv4 connection
instructions and rerun the link, dry-run, or push command.
