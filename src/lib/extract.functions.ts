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
