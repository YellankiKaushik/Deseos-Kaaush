# Storage Setup

AspireList uses one private Supabase Storage bucket:

```text
item-images
```

The latest storage migration creates or updates the bucket with:

- `public = false`
- `file_size_limit = 10485760`
- allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

## Path Rules

Files are stored under:

```text
<auth user id>/<item id>/<timestamp>.<ext>
```

Storage policies on `storage.objects` allow authenticated users to select, insert, update, and delete objects only when the first folder segment matches `auth.uid()`.

## Client Behavior

`src/lib/images.ts` validates uploads, resizes/compresses images client-side, uploads to Supabase Storage, removes replaced images, and creates signed URLs for display.

Binary image export is not implemented. JSON export includes image metadata and item image paths.
