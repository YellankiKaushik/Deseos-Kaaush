import { supabase } from "@/integrations/supabase/client";
import type { Category, Collection, Item, Profile } from "@/lib/aspire";

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchItem(id: string) {
  const { data, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCollection(id: string): Promise<Collection | null> {
  const { data, error } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchItemCollections(itemId: string) {
  const { data, error } = await supabase
    .from("item_collections")
    .select("collection_id")
    .eq("item_id", itemId);
  if (error) throw error;
  return (data ?? []).map((row) => row.collection_id);
}

export async function fetchAllItemCollections() {
  const { data, error } = await supabase.from("item_collections").select("collection_id, item_id");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCollectionItemIds(collectionId: string) {
  const { data, error } = await supabase
    .from("item_collections")
    .select("item_id")
    .eq("collection_id", collectionId);
  if (error) throw error;
  return (data ?? []).map((row) => row.item_id);
}

export async function fetchPriceHistory(itemId: string) {
  const { data, error } = await supabase
    .from("price_history")
    .select("*")
    .eq("item_id", itemId)
    .order("checked_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findDuplicateItems(normalizedUrl: string) {
  if (!normalizedUrl) return [] as Item[];
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("normalized_url", normalizedUrl)
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[, ]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function intOrNull(value: string) {
  const parsed = numberOrNull(value);
  return parsed == null ? null : Math.round(parsed);
}

/** Collects every row this user owns into one versioned, portable backup object. */
export async function exportUserData() {
  const userId = await requireUserId();
  const [profile, items, categories, collections, itemCollections, priceHistory, images, logs] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("items").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("collections").select("*"),
      supabase.from("item_collections").select("*"),
      supabase.from("price_history").select("*"),
      supabase.from("item_images").select("*"),
      supabase.from("extraction_logs").select("*").limit(1000),
    ]);

  for (const result of [
    profile,
    items,
    categories,
    collections,
    itemCollections,
    priceHistory,
    images,
    logs,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    format: "aspirelist-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      profile: profile.data,
      settings: profile.data
        ? {
            default_currency: profile.data.default_currency,
            default_view: profile.data.default_view,
            theme: profile.data.theme,
          }
        : null,
      items: items.data ?? [],
      categories: categories.data ?? [],
      collections: collections.data ?? [],
      item_collections: itemCollections.data ?? [],
      price_history: priceHistory.data ?? [],
      item_images: images.data ?? [],
      extraction_logs: logs.data ?? [],
    },
  };
}
