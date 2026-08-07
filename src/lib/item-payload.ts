import type { TablesInsert } from "@/integrations/supabase/types";
import type { ItemFormValues } from "@/components/item-form";
import { domainOf, normalizeUrl } from "@/lib/aspire";
import { intOrNull, numberOrNull } from "@/lib/queries";

export type ExtractionMeta = {
  status: string;
  method: string;
  confidence: number | null;
  error: string | null;
  warnings: string[];
  lastCheckedAt?: string | null;
};

/** Single mapping from form state to a database row, shared by create and update. */
export function itemPayload(values: ItemFormValues, meta?: ExtractionMeta | null) {
  const sourceUrl = values.source_url.trim() || null;
  const canonicalUrl = values.canonical_url.trim() || null;
  const payload: Omit<TablesInsert<"items">, "user_id"> = {
    title: values.title.trim(),
    source_url: sourceUrl,
    canonical_url: canonicalUrl,
    source_domain: domainOf(canonicalUrl ?? sourceUrl),
    normalized_url: normalizeUrl(canonicalUrl ?? sourceUrl),
    store_name: values.store_name.trim() || null,
    brand: values.brand.trim() || null,
    description: values.description.trim() || null,
    current_price: numberOrNull(values.current_price),
    original_price: numberOrNull(values.original_price),
    currency: values.currency,
    rating: numberOrNull(values.rating),
    review_count: intOrNull(values.review_count),
    availability: values.availability.trim() || null,
    primary_image_url: values.primary_image_url.trim() || null,
    image_storage_path: values.image_storage_path || null,
    category_id: values.category_id === "none" ? null : values.category_id,
    priority: values.priority,
    status: values.status,
    reason_for_wanting: values.reason_for_wanting.trim() || null,
    personal_notes: values.personal_notes.trim() || null,
    target_purchase_date: values.target_purchase_date || null,
    target_budget: numberOrNull(values.target_budget),
    amount_saved: numberOrNull(values.amount_saved) ?? 0,
  };

  if (meta) {
    payload.extraction_status = meta.status;
    payload.extraction_method = meta.method;
    payload.extraction_confidence = meta.confidence;
    payload.extraction_error = meta.error;
    payload.extraction_warnings = meta.warnings.length ? meta.warnings : null;
    payload.last_checked_at = meta.lastCheckedAt ?? new Date().toISOString();
  }

  return payload;
}
