import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const extractProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { url: string }) => {
    if (!input || typeof input.url !== "string" || input.url.trim().length === 0) {
      throw new Error("A product URL is required");
    }
    if (input.url.length > 2048) throw new Error("That URL is too long");
    return { url: input.url.trim() };
  })
  .handler(async ({ data, context }) => {
    const { fetchAndExtract } = await import("./extract.server");
    const started = Date.now();
    const result = await fetchAndExtract(data.url);
    const duration = Date.now() - started;

    await context.supabase.from("extraction_logs").insert({
      user_id: context.userId,
      requested_url: data.url,
      resolved_url: result.resolvedUrl,
      domain: result.domain,
      status: result.status,
      method: result.method,
      fields_found: result.fieldsFound,
      error_code: result.errorCode ?? null,
      error_message: result.errorMessage ?? null,
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
