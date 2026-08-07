import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "@/lib/queries";

export type BackupFile = {
  format: string;
  version: number;
  exportedAt?: string;
  data: Record<string, unknown>;
};

export type ImportSummary = { table: string; restored: number }[];

const ITEM_TABLES = [
  "categories",
  "collections",
  "items",
  "item_collections",
  "price_history",
  "item_images",
] as const;

/** Throws a readable error when the file isn't an AspireList backup we understand. */
export function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!parsed || typeof parsed !== "object")
    throw new Error("That file isn't an AspireList backup.");
  const file = parsed as Partial<BackupFile>;
  if (file.format !== "aspirelist-backup") throw new Error("That file isn't an AspireList backup.");
  if (file.version !== 1)
    throw new Error(`Backup version ${String(file.version)} isn't supported.`);
  if (!file.data || typeof file.data !== "object")
    throw new Error("That backup has no data in it.");
  return file as BackupFile;
}

function rows(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

/**
 * Restores a backup into the signed-in account. Rows keep their original ids so
 * relationships survive, and existing rows with the same id are updated rather
 * than duplicated. Ownership is always rewritten to the current user.
 */
export async function importUserData(file: BackupFile): Promise<ImportSummary> {
  const userId = await requireUserId();
  const summary: ImportSummary = [];

  const settings = file.data["settings"] as Record<string, unknown> | null | undefined;
  if (settings) {
    const { error } = await supabase
      .from("profiles")
      .update({
        default_currency: String(settings["default_currency"] ?? "INR"),
        default_view: String(settings["default_view"] ?? "grid"),
        theme: String(settings["theme"] ?? "system"),
      })
      .eq("id", userId);
    if (error) throw error;
    summary.push({ table: "settings", restored: 1 });
  }
  // Freshly created accounts are seeded with default categories whose names
  // would collide with the backup's. Unused ones are safe to clear first.
  const backupCategories = rows(file.data, "categories");
  if (backupCategories.length) {
    const { data: usedRows } = await supabase
      .from("items")
      .select("category_id")
      .not("category_id", "is", null);
    const used = new Set((usedRows ?? []).map((r) => r.category_id));
    const { data: existing } = await supabase.from("categories").select("id");
    const removable = (existing ?? []).map((r) => r.id).filter((id) => !used.has(id));
    if (removable.length) await supabase.from("categories").delete().in("id", removable);
  }

  for (const table of ITEM_TABLES) {
    const list = rows(file.data, table).map((row) => ({ ...row, user_id: userId }));
    if (!list.length) continue;
    const onConflict = table === "item_collections" ? "item_id,collection_id" : "id";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any).upsert(list, { onConflict });
    if (error) throw error;
    summary.push({ table, restored: list.length });
  }

  return summary;
}
