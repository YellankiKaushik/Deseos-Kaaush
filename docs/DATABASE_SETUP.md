# Database Setup

The canonical setup path is [Self-host WishList](./SELF_HOSTING.md). This file is a focused
database reference.

Apply migrations with the Supabase CLI:

```bash
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

The Local and Remote migration versions should match after a successful push. Do not manually
recreate tables if migrations already define them, and do not edit already-applied migrations.

## Tables

- `profiles`: one row per auth user; stores display name, avatar URL, default currency, default dashboard view, and theme.
- `categories`: user-owned categories with optional icon and unique `(user_id, name)`.
- `collections`: user-owned item groups with description, cover URL, optional target date/budget, and position.
- `items`: user-owned wishlist item records, including source URLs, pricing, category, lifecycle status, savings fields, extraction metadata, purchase fields, archive flag, and image pointers.
- `item_collections`: many-to-many user-owned join between items and collections.
- `item_images`: user-owned image metadata for uploaded or remote item images.
- `price_history`: user-owned item price snapshots.
- `extraction_logs`: user-owned product extraction attempts.

## RLS

All public application tables enable Row Level Security. Authenticated users can select, insert, update, and delete only rows where `auth.uid()` matches their row ownership (`id` for `profiles`, `user_id` elsewhere).

The migration `20260915122500_harden_storage_and_relationship_ownership.sql` adds trigger checks to ensure:

- `items.category_id` belongs to the same user as the item.
- `item_collections.item_id` and `collection_id` both belong to the same user as the join row.
- `item_images.item_id`, `price_history.item_id`, and `extraction_logs.item_id` belong to the same user as the child row.

## Data API Grants

The initial migration grants authenticated access to the public tables. New Supabase projects may require explicit Data API exposure settings in the Supabase dashboard in addition to SQL grants.

## Signup Bootstrap

`public.handle_new_user()` creates a profile and default categories after `auth.users` insert. Public execute permissions are revoked after trigger creation.
