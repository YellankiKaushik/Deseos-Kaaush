import {
  EXTRACTION_FIELDS,
  type ExtractionFieldKey,
  type ExtractionFieldsFound,
} from "@/lib/extraction/fields";
import type { ImageCandidate, ProductExtractionResult } from "@/lib/extraction/types";

const FALLBACK_CONFIDENCE_THRESHOLD = 70;

export function emptyFieldsFound(): ExtractionFieldsFound {
  return Object.fromEntries(
    EXTRACTION_FIELDS.map(({ key }) => [key, false]),
  ) as ExtractionFieldsFound;
}

export function summarizeFields(result: ProductExtractionResult) {
  const values: Record<ExtractionFieldKey, boolean> = {
    title: Boolean(result.title),
    brand: Boolean(result.brand),
    description: Boolean(result.description),
    price: result.price !== null,
    originalPrice: result.originalPrice !== null,
    currency: Boolean(result.currency),
    rating: result.rating !== null,
    reviewCount: result.reviewCount !== null,
    availability: Boolean(result.availability),
    storeName: Boolean(result.storeName),
    canonicalUrl: Boolean(result.canonicalUrl),
    imageUrl: Boolean(result.imageUrl),
  };
  result.fieldsFound = values;
  result.confidence = EXTRACTION_FIELDS.reduce(
    (total, field) => total + (values[field.key] ? field.weight : 0),
    0,
  );
  return result;
}

export function fallbackReason(native: ProductExtractionResult): string | null {
  if (native.status === "failed") return native.errorCode ?? "native_failed";
  if (["blocked", "rate_limited", "timeout"].includes(native.errorCode ?? "")) {
    return native.errorCode ?? null;
  }
  if (/^http_(?:5\d\d|429|401|403)$/.test(native.errorCode ?? "")) return native.errorCode ?? null;
  if (!native.title) return "missing_title";
  if (native.title && !native.imageUrl && native.price === null) return "missing_image_and_price";
  if (native.confidence < FALLBACK_CONFIDENCE_THRESHOLD) return "low_confidence";
  return null;
}

export function shouldUseFallback(native: ProductExtractionResult) {
  return fallbackReason(native) !== null;
}

function dedupeCandidates(candidates: ImageCandidate[]) {
  const bestByUrl = new Map<string, ImageCandidate>();
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate.url);
      parsed.hash = "";
      const key = parsed.toString();
      const existing = bestByUrl.get(key);
      if (!existing || candidate.score > existing.score)
        bestByUrl.set(key, { ...candidate, url: key });
    } catch {
      // Invalid candidates are ignored during merge; providers validate before import too.
    }
  }
  return [...bestByUrl.values()].sort((a, b) => b.score - a.score);
}

function mergedStatus(result: ProductExtractionResult) {
  if (!result.title) return "failed";
  if (result.confidence >= 70) return "success";
  return "partial";
}

export function mergeExtractionResults(
  native: ProductExtractionResult,
  fallback: ProductExtractionResult | null,
  reason: string | null,
): ProductExtractionResult {
  if (!fallback) {
    return {
      ...native,
      diagnostics: {
        ...native.diagnostics,
        nativeStatus: native.status,
        fallbackAttempted: false,
        fallbackStatus: "skipped",
        fallbackReason: reason,
        providerUsed: "native",
        imageCandidateCount: native.imageCandidates.length,
      },
    };
  }

  if (fallback.status === "failed") {
    return {
      ...native,
      warnings: [...new Set([...native.warnings, ...fallback.warnings])],
      diagnostics: {
        nativeStatus: native.status,
        fallbackAttempted: true,
        fallbackStatus: "failed",
        fallbackReason: reason,
        providerUsed: "native",
        imageCandidateCount: native.imageCandidates.length,
      },
    };
  }

  const imageCandidates = dedupeCandidates([
    ...native.imageCandidates,
    ...fallback.imageCandidates,
  ]).slice(0, 8);

  const merged: ProductExtractionResult = {
    ...native,
    resolvedUrl: native.resolvedUrl ?? fallback.resolvedUrl,
    canonicalUrl: native.canonicalUrl ?? fallback.canonicalUrl,
    domain: native.domain ?? fallback.domain,
    storeName:
      native.status === "failed"
        ? (fallback.storeName ?? native.storeName)
        : (native.storeName ?? fallback.storeName),
    title: native.title ?? fallback.title,
    brand: native.brand ?? fallback.brand,
    description: native.description ?? fallback.description,
    price: native.price,
    originalPrice: native.originalPrice,
    currency: native.currency,
    rating: native.rating,
    reviewCount: native.reviewCount,
    availability: native.availability,
    imageUrl: imageCandidates[0]?.url ?? native.imageUrl ?? fallback.imageUrl,
    imageCandidates,
    method: [
      ...new Set([native.method, fallback.method].filter((method) => method !== "none")),
    ].join("+"),
    provider: "merged",
    warnings: [...new Set([...native.warnings, ...fallback.warnings])],
    diagnostics: {
      nativeStatus: native.status,
      fallbackAttempted: true,
      fallbackStatus: fallback.status,
      fallbackReason: reason,
      providerUsed: "merged",
      imageCandidateCount: imageCandidates.length,
    },
  };

  summarizeFields(merged);
  merged.status = mergedStatus(merged);
  delete merged.errorCode;
  delete merged.errorMessage;
  if (merged.status === "failed") {
    merged.errorCode = fallback.errorCode ?? native.errorCode ?? "no_product_metadata";
    merged.errorMessage =
      "We couldn't read this product automatically. The link is saved, and you can fill in anything missing.";
  } else if (merged.status === "partial") {
    merged.errorCode = "limited_details";
    merged.errorMessage = "We found limited details. You can fill in anything missing.";
  }

  return merged;
}
