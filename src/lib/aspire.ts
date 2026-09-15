import type { Tables } from "@/integrations/supabase/types";

export type Item = Tables<"items">;
export type Category = Tables<"categories">;
export type Collection = Tables<"collections">;
export type Profile = Tables<"profiles">;

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "dream", label: "Dream" },
] as const;

export const STATUSES = [
  { value: "considering", label: "Considering" },
  { value: "wanted", label: "Wanted" },
  { value: "saving", label: "Saving" },
  { value: "ready_to_buy", label: "Ready to buy" },
  { value: "purchased", label: "Purchased" },
  { value: "rejected", label: "Not for me" },
] as const;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "JPY", "SGD"];

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "priority", label: "Priority" },
  { value: "target_date", label: "Target date" },
  { value: "updated", label: "Recently updated" },
] as const;

export type SortValue = (typeof SORTS)[number]["value"];
export type ViewMode = "grid" | "list";

const PRIORITY_RANK: Record<string, number> = { dream: 0, high: 1, medium: 2, low: 3 };

export function statusLabel(value: string) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function priorityLabel(value: string) {
  return PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
) {
  if (amount === null || amount === undefined) return "—";
  const code = currency || "INR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}

export function savingsProgress(item: Item) {
  const goal = Number(item.target_budget ?? item.current_price ?? 0);
  const saved = Number(item.amount_saved ?? 0);
  if (!goal || goal <= 0) return { pct: 0, goal: 0, saved, remaining: 0 };
  const pct = Math.min(100, Math.round((saved / goal) * 100));
  return { pct, goal, saved, remaining: Math.max(0, goal - saved) };
}

export function sortItems(items: Item[], sort: SortValue) {
  const copy = [...items];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "price_asc":
      return copy.sort(
        (a, b) => Number(a.current_price ?? Infinity) - Number(b.current_price ?? Infinity),
      );
    case "price_desc":
      return copy.sort(
        (a, b) => Number(b.current_price ?? -Infinity) - Number(a.current_price ?? -Infinity),
      );
    case "priority":
      return copy.sort(
        (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
      );
    case "target_date":
      return copy.sort((a, b) =>
        (a.target_purchase_date ?? "9999").localeCompare(b.target_purchase_date ?? "9999"),
      );
    case "updated":
      return copy.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    case "newest":
    default:
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

/** Group monetary totals per currency — never add different currencies together. */
export function totalsByCurrency(items: Item[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const price = Number(item.current_price ?? 0);
    if (!price) continue;
    const code = item.currency || "INR";
    totals.set(code, (totals.get(code) ?? 0) + price);
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }));
}

export function domainOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Stable key for spotting the same product saved twice (tracking params removed). */
export function normalizeUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    parsed.hash = "";
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|ref|referrer|fbclid|gclid|tag|linkCode|psc|th|source)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.hostname}${path}${parsed.search}`;
  } catch {
    return null;
  }
}

export function cleanHttpUrl(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`${label} must start with http:// or https://.`);
    }
    return parsed.toString();
  } catch (error) {
    if (error instanceof Error && error.message.includes(label)) throw error;
    throw new Error(`${label} must be a valid http or https URL.`);
  }
}

export function itemMatchesSearch(item: Item, term: string) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [
    item.title,
    item.brand,
    item.store_name,
    item.source_domain,
    item.description,
    item.reason_for_wanting,
    item.personal_notes,
  ].some((value) => value?.toLowerCase().includes(needle));
}
