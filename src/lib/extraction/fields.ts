export const EXTRACTION_FIELDS = [
  { key: "title", label: "name", weight: 30 },
  { key: "brand", label: "brand", weight: 4 },
  { key: "description", label: "description", weight: 5 },
  { key: "price", label: "price", weight: 20 },
  { key: "originalPrice", label: "original price", weight: 4 },
  { key: "currency", label: "currency", weight: 5 },
  { key: "rating", label: "rating", weight: 4 },
  { key: "reviewCount", label: "review count", weight: 3 },
  { key: "availability", label: "availability", weight: 4 },
  { key: "storeName", label: "store", weight: 5 },
  { key: "canonicalUrl", label: "canonical link", weight: 6 },
  { key: "imageUrl", label: "image", weight: 10 },
] as const;

export type ExtractionFieldKey = (typeof EXTRACTION_FIELDS)[number]["key"];

export type ExtractionFieldsFound = Record<ExtractionFieldKey, boolean>;
