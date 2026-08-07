const FIELD_LABELS: Record<string, string> = {
  title: "name",
  price: "price",
  originalPrice: "original price",
  currency: "currency",
  imageUrl: "image",
  description: "description",
  brand: "brand",
  storeName: "store",
  rating: "rating",
  reviewCount: "review count",
  availability: "availability",
};

/** Human-readable list of fields the extractor could not find. */
export function missingFieldWarnings(
  fieldsFound: Record<string, boolean> | null | undefined,
): string[] {
  if (!fieldsFound) return [];
  return Object.entries(FIELD_LABELS)
    .filter(([key]) => !fieldsFound[key])
    .map(([, label]) => label);
}
