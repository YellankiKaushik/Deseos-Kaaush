import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: topLevelFiles } = await supabaseAdmin.storage.from("item-images").list(userId);
    const paths: string[] = [];

    for (const entry of topLevelFiles ?? []) {
      const prefix = `${userId}/${entry.name}`;
      const { data: nested } = await supabaseAdmin.storage.from("item-images").list(prefix);
      if (nested?.length) {
        paths.push(...nested.map((file) => `${prefix}/${file.name}`));
      } else {
        paths.push(prefix);
      }
    }

    if (paths.length) {
      await supabaseAdmin.storage.from("item-images").remove(paths);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return { deleted: true };
  });
