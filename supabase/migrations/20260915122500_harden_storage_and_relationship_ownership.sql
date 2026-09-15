-- Supabase CLI is unavailable in this workspace, so this migration was created manually.
-- It keeps the private item image bucket reproducible and prevents cross-user relationship spoofing.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

CREATE OR REPLACE FUNCTION public.assert_item_category_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.categories
    WHERE id = NEW.category_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'category_id must belong to the same user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assert_item_category_owner_trigger ON public.items;
CREATE TRIGGER assert_item_category_owner_trigger
BEFORE INSERT OR UPDATE OF user_id, category_id ON public.items
FOR EACH ROW EXECUTE FUNCTION public.assert_item_category_owner();

CREATE OR REPLACE FUNCTION public.assert_item_collection_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.items
    WHERE id = NEW.item_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'item_id must belong to the same user';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.collections
    WHERE id = NEW.collection_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'collection_id must belong to the same user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assert_item_collection_owner_trigger ON public.item_collections;
CREATE TRIGGER assert_item_collection_owner_trigger
BEFORE INSERT OR UPDATE OF user_id, item_id, collection_id ON public.item_collections
FOR EACH ROW EXECUTE FUNCTION public.assert_item_collection_owner();

CREATE OR REPLACE FUNCTION public.assert_item_child_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.item_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.items
    WHERE id = NEW.item_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'item_id must belong to the same user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assert_item_images_owner_trigger ON public.item_images;
CREATE TRIGGER assert_item_images_owner_trigger
BEFORE INSERT OR UPDATE OF user_id, item_id ON public.item_images
FOR EACH ROW EXECUTE FUNCTION public.assert_item_child_owner();

DROP TRIGGER IF EXISTS assert_price_history_owner_trigger ON public.price_history;
CREATE TRIGGER assert_price_history_owner_trigger
BEFORE INSERT OR UPDATE OF user_id, item_id ON public.price_history
FOR EACH ROW EXECUTE FUNCTION public.assert_item_child_owner();

DROP TRIGGER IF EXISTS assert_extraction_logs_owner_trigger ON public.extraction_logs;
CREATE TRIGGER assert_extraction_logs_owner_trigger
BEFORE INSERT OR UPDATE OF user_id, item_id ON public.extraction_logs
FOR EACH ROW EXECUTE FUNCTION public.assert_item_child_owner();

REVOKE EXECUTE ON FUNCTION public.assert_item_category_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_item_collection_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_item_child_owner() FROM PUBLIC, anon, authenticated;
