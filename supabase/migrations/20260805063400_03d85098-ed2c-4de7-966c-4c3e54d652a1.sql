ALTER TABLE public.items ADD COLUMN IF NOT EXISTS extraction_warnings text[];
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS normalized_url text;
CREATE INDEX IF NOT EXISTS items_user_normalized_url_idx ON public.items (user_id, normalized_url);

CREATE POLICY "item_images_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "item_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "item_images_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "item_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);