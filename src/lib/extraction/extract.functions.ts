import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProductExtractionResult } from "@/lib/extraction/types";

export const extractProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { url: string; skipDuplicateCache?: boolean }) => {
    if (!input || typeof input.url !== "string" || input.url.trim().length === 0) {
      throw new Error("A product URL is required");
    }
    if (input.url.length > 2048) throw new Error("That URL is too long");
    return { url: input.url.trim(), skipDuplicateCache: Boolean(input.skipDuplicateCache) };
  })
  .handler(async ({ data, context }) => {
    const { fetchAndExtract } = await import("./extract.server");
    const { normalizeUrl } = await import("@/lib/wishlist");
    const { emptyFieldsFound, summarizeFields } = await import("./merge-results");
    const started = Date.now();
    const normalized = data.skipDuplicateCache ? null : normalizeUrl(data.url);
    const { data: duplicate } = normalized
      ? await context.supabase
          .from("items")
          .select("*")
          .eq("user_id", context.userId)
          .eq("normalized_url", normalized)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    let result: ProductExtractionResult;
    if (duplicate) {
      result = summarizeFields({
        requestedUrl: data.url,
        resolvedUrl: duplicate.source_url,
        canonicalUrl: duplicate.canonical_url,
        domain: duplicate.source_domain,
        storeName: duplicate.store_name,
        title: duplicate.title,
        brand: duplicate.brand,
        description: duplicate.description,
        price: duplicate.current_price === null ? null : Number(duplicate.current_price),
        originalPrice: duplicate.original_price === null ? null : Number(duplicate.original_price),
        currency: duplicate.currency,
        rating: duplicate.rating === null ? null : Number(duplicate.rating),
        reviewCount: duplicate.review_count,
        availability: duplicate.availability,
        imageUrl: duplicate.primary_image_url,
        imageCandidates: duplicate.primary_image_url
          ? [{ url: duplicate.primary_image_url, source: "img-heuristic", score: 70 }]
          : [],
        method: "existing-item-cache",
        provider: "native",
        confidence: 0,
        status: "success",
        warnings: ["This link is already saved in your WishList."],
        fieldsFound: emptyFieldsFound(),
        diagnostics: {
          nativeStatus: "success",
          fallbackAttempted: false,
          fallbackStatus: "skipped",
          fallbackReason: "duplicate_url",
          providerUsed: "native",
          imageCandidateCount: duplicate.primary_image_url ? 1 : 0,
        },
      });
      result.status = result.confidence >= 70 ? "success" : "partial";
    } else {
      result = await fetchAndExtract(data.url);
    }
    const duration = Date.now() - started;

    await context.supabase.from("extraction_logs").insert({
      user_id: context.userId,
      requested_url: data.url,
      resolved_url: result.resolvedUrl,
      domain: result.domain,
      status: result.status,
      method: result.method,
      provider_used: result.diagnostics?.providerUsed ?? result.provider,
      native_status:
        result.diagnostics?.nativeStatus ?? (result.provider === "native" ? result.status : null),
      fallback_attempted: result.diagnostics?.fallbackAttempted ?? false,
      fallback_status: result.diagnostics?.fallbackStatus ?? null,
      final_status: result.status,
      confidence: Math.round(result.confidence),
      fields_found: result.fieldsFound,
      error_code:
        result.errorCode ??
        (result.warnings.some((warning) => warning.toLowerCase().includes("image"))
          ? "image_only_warning"
          : null),
      error_message:
        result.errorMessage ?? (result.warnings.length ? result.warnings.join("; ") : null),
      duration_ms: duration,
    });

    return result;
  });

export const importRemoteItemImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: {
      itemId: string;
      imageUrl: string;
      imageCandidates?: string[] | null;
      productPageUrl?: string | null;
      altText?: string | null;
      existingWarnings?: string[] | null;
    }) => {
      if (!input || typeof input.itemId !== "string" || input.itemId.trim().length === 0) {
        throw new Error("An item ID is required");
      }
      if (!input.imageUrl || typeof input.imageUrl !== "string") {
        throw new Error("An image URL is required");
      }
      if (input.imageUrl.length > 2048) throw new Error("That image URL is too long");
      return {
        itemId: input.itemId.trim(),
        imageUrl: input.imageUrl.trim(),
        imageCandidates: Array.isArray(input.imageCandidates)
          ? input.imageCandidates
              .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
              .map((url) => url.trim())
              .slice(0, 5)
          : [],
        productPageUrl:
          typeof input.productPageUrl === "string" ? input.productPageUrl.trim() : null,
        altText: typeof input.altText === "string" ? input.altText.trim() : null,
        existingWarnings: Array.isArray(input.existingWarnings) ? input.existingWarnings : [],
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { importRemoteImageForItem } = await import("./image-import.server");
    try {
      return {
        ok: true as const,
        ...(await importRemoteImageForItem({
          supabase: context.supabase,
          userId: context.userId,
          itemId: data.itemId,
          imageUrl: data.imageUrl,
          imageUrls: data.imageCandidates,
          referrerUrl: data.productPageUrl,
          altText: data.altText ?? "",
        })),
        warnings: data.existingWarnings,
      };
    } catch (error) {
      const { imageImportFallbackResult } = await import("./image-import.server");
      const result = imageImportFallbackResult(data.imageUrl, data.existingWarnings, error);
      await context.supabase
        .from("items")
        .update({ extraction_warnings: result.warnings.length ? result.warnings : null })
        .eq("id", data.itemId);
      return result;
    }
  });
