import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "@/lib/queries";

export type BackupFile = {
  format: string;
  version: number;
  exportedAt?: string;
  data: Record<string, unknown>;
};

export type ImportMode = "merge" | "replace";
export type ImportSummary = { table: string; restored: number; skipped?: number }[];

export const BACKUP_FORMAT = "wishlist-backup";
export const LEGACY_BACKUP_FORMAT = "aspirelist-backup";

const ITEM_TABLES = [
  "categories",
  "collections",
  "items",
  "item_collections",
  "price_history",
  "item_images",
] as const;

const REPLACE_DELETE_ORDER = [
  "price_history",
  "item_images",
  "item_collections",
  "items",
  "categories",
  "collections",
] as const;

/** Throws a readable error when the file isn't a WishList backup we understand. */
export function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("That file isn't a WishList backup.");
  const file = parsed as Partial<BackupFile>;
  if (file.format !== BACKUP_FORMAT && file.format !== LEGACY_BACKUP_FORMAT) {
    throw new Error("That file isn't a WishList backup.");
  }
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

function rowKey(table: (typeof ITEM_TABLES)[number], row: Record<string, unknown>) {
  if (table === "item_collections") {
    return `${String(row["item_id"] ?? "")}:${String(row["collection_id"] ?? "")}`;
  }
  return String(row["id"] ?? "");
}

function ownedRows(rowsToImport: Record<string, unknown>[], userId: string) {
  return rowsToImport.map((row) => ({ ...row, user_id: userId }));
}

export function backupRowCounts(file: BackupFile) {
  return ITEM_TABLES.map((table) => ({ table, count: rows(file.data, table).length }));
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text =
    Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function itemsToCsv(items: Record<string, unknown>[]) {
  const columns = [
    "title",
    "brand",
    "store_name",
    "source_url",
    "canonical_url",
    "current_price",
    "original_price",
    "currency",
    "status",
    "priority",
    "target_budget",
    "amount_saved",
    "target_purchase_date",
    "purchased_at",
    "actual_purchase_price",
    "purchase_reflection",
    "reason_for_wanting",
    "personal_notes",
    "availability",
    "rating",
    "review_count",
    "created_at",
    "updated_at",
  ];
  return [
    columns.map(csvCell).join(","),
    ...items.map((item) => columns.map((column) => csvCell(item[column])).join(",")),
  ].join("\n");
}

/**
 * Restores a backup into the signed-in account. Rows keep their original ids so
 * relationships survive, and existing rows with the same id are updated rather
 * than duplicated. Ownership is always rewritten to the current user.
 */
export async function importUserData(
  file: BackupFile,
  options: { mode?: ImportMode; replaceConfirmation?: string } = {},
): Promise<ImportSummary> {
  const userId = await requireUserId();
  const mode = options.mode ?? "merge";
  const summary: ImportSummary = [];

  if (mode === "replace" && options.replaceConfirmation !== "REPLACE") {
    throw new Error("Type REPLACE to replace your current WishList data.");
  }

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

  if (mode === "replace") {
    for (const table of REPLACE_DELETE_ORDER) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase.from(table) as any).delete();
      const { error } =
        table === "items" ||
        table === "categories" ||
        table === "collections" ||
        table === "item_collections" ||
        table === "item_images" ||
        table === "price_history"
          ? await query.eq("user_id", userId)
          : await query;
      if (error) throw error;
    }
  } else {
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
  }

  for (const table of ITEM_TABLES) {
    const list = ownedRows(rows(file.data, table), userId);
    if (!list.length) continue;
    const onConflict = table === "item_collections" ? "item_id,collection_id" : "id";
    let insertable = list;
    let skipped = 0;

    if (mode === "merge") {
      const idColumn = table === "item_collections" ? "item_id,collection_id" : "id";
      const { data: existing, error: existingError } = await supabase.from(table).select(idColumn);
      if (existingError) throw existingError;
      const existingKeys = new Set(
        ((existing ?? []) as unknown as Record<string, unknown>[]).map((row) => rowKey(table, row)),
      );
      insertable = list.filter((row) => !existingKeys.has(rowKey(table, row)));
      skipped = list.length - insertable.length;
    }

    if (!insertable.length) {
      summary.push({ table, restored: 0, skipped });
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any).upsert(insertable, { onConflict });
    if (error) throw error;
    summary.push({ table, restored: insertable.length, skipped });
  }

  return summary;
}
