# Storage Setup

The canonical setup path is [Self-host WishList](./SELF_HOSTING.md). This file is a focused storage
reference.

WishList uses one private Supabase Storage bucket:

```text
item-images
```

The migration `20260915122500_harden_storage_and_relationship_ownership.sql` creates or updates the
bucket with:

- `public = false`
- `file_size_limit = 10485760`
- allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

## Path Rules

Files are stored under:

```text
<auth user id>/<item id>/<timestamp>.<ext>
```

Storage policies on `storage.objects` allow authenticated users to select, insert, update, and
delete objects only when the first folder segment matches `auth.uid()`.

## Client Behavior

`src/lib/images.ts` validates uploads, resizes/compresses images client-side, uploads to Supabase Storage, removes replaced images, and creates signed URLs for display.

Binary image export is not implemented. JSON export includes image metadata and item image paths.

## Manual Verification

After migrations, verify the bucket exists:

```text
Supabase -> Storage -> item-images
```

Do not create a public bucket. WishList expects private storage and signed URLs.
