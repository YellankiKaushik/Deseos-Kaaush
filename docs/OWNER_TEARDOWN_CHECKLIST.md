# Owner Teardown Checklist

This checklist is for dismantling an existing WishList installation. Deleting infrastructure is
optional for other users and is necessary only when you intentionally want to remove an installation.

Do not put secrets in this file.

## Before Deleting Infrastructure

- Export any important WishList data.
- Export JSON or CSV from the app if desired.
- Verify the Git repository has no secrets.
- Verify all migrations exist locally.
- Verify documentation is complete.
- Verify `.env.example` is generic.
- Verify local tests pass.

## Delete Vercel

- Open Vercel.
- Open the WishList project.
- Open Settings.
- Delete Project.
- Verify the production URL no longer exists.

## Delete Supabase

Warning: this permanently deletes database, auth, and storage data.

- Open Supabase.
- Open the project.
- Open Project Settings.
- Delete the project.
- Confirm project deletion only after exports and backups are complete.

## Delete Google OAuth

- Open Google Cloud.
- Open Google Auth Platform.
- Open Clients.
- Delete the WishList OAuth client.

Optionally delete the entire Google Cloud project if it exists only for WishList.

## Verify

- Old production URL is gone.
- Old Supabase project is gone.
- OAuth client is gone.
