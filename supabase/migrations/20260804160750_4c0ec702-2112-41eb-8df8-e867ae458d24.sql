-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  default_currency text NOT NULL DEFAULT 'INR',
  default_view text NOT NULL DEFAULT 'grid' CHECK (default_view IN ('grid','list')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('system','light','dark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all_own" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- collections
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image_url text,
  target_date date,
  target_budget numeric(14,2),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_all_own" ON public.collections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- items
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url text,
  canonical_url text,
  source_domain text,
  store_name text,
  title text NOT NULL,
  brand text,
  description text,
  current_price numeric(14,2) CHECK (current_price IS NULL OR current_price >= 0),
  original_price numeric(14,2) CHECK (original_price IS NULL OR original_price >= 0),
  currency text,
  rating numeric(3,2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  review_count integer,
  availability text,
  primary_image_url text,
  image_storage_path text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','dream')),
  status text NOT NULL DEFAULT 'considering' CHECK (status IN ('considering','wanted','saving','ready_to_buy','purchased','rejected')),
  reason_for_wanting text,
  personal_notes text,
  target_purchase_date date,
  target_budget numeric(14,2),
  amount_saved numeric(14,2) NOT NULL DEFAULT 0 CHECK (amount_saved >= 0),
  extraction_status text NOT NULL DEFAULT 'manual' CHECK (extraction_status IN ('manual','pending','success','partial','failed')),
  extraction_confidence numeric(5,2),
  extraction_method text,
  extraction_error text,
  last_checked_at timestamptz,
  purchased_at date,
  actual_purchase_price numeric(14,2),
  purchase_reflection text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_all_own" ON public.items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX items_user_id_idx ON public.items(user_id);
CREATE INDEX items_user_status_idx ON public.items(user_id, status);
CREATE INDEX items_user_created_at_idx ON public.items(user_id, created_at DESC);
CREATE INDEX items_user_priority_idx ON public.items(user_id, priority);
CREATE INDEX items_canonical_url_idx ON public.items(user_id, canonical_url);

-- item_collections
CREATE TABLE public.item_collections (
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, collection_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_collections TO authenticated;
GRANT ALL ON public.item_collections TO service_role;
ALTER TABLE public.item_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_collections_all_own" ON public.item_collections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- item_images
CREATE TABLE public.item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url text,
  storage_path text,
  alt_text text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_images TO authenticated;
GRANT ALL ON public.item_images TO service_role;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_images_all_own" ON public.item_images FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- price_history
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price numeric(14,2) NOT NULL,
  currency text NOT NULL,
  availability text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_history_all_own" ON public.price_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX price_history_item_checked_idx ON public.price_history(item_id, checked_at DESC);

-- extraction_logs
CREATE TABLE public.extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  requested_url text NOT NULL,
  resolved_url text,
  domain text,
  status text NOT NULL,
  method text,
  fields_found jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extraction_logs TO authenticated;
GRANT ALL ON public.extraction_logs TO service_role;
ALTER TABLE public.extraction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extraction_logs_all_own" ON public.extraction_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- new user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.categories (user_id, name, icon)
  SELECT NEW.id, c.name, c.icon FROM (VALUES
    ('Technology','laptop'), ('Fashion','shirt'), ('Home','house'), ('Travel','plane'),
    ('Fitness','dumbbell'), ('Education','book-open'), ('Vehicle','car'),
    ('Experience','sparkles'), ('Other','package')
  ) AS c(name, icon)
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();