import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ItemForm, emptyItemForm } from "@/components/item-form";
import {
  cleanHttpUrl,
  domainOf,
  formatMoney,
  itemMatchesSearch,
  normalizeUrl,
  savingsProgress,
  totalsByCurrency,
} from "@/lib/aspire";
import { backupRowCounts, itemsToCsv, parseBackup } from "@/lib/backup";
import { itemPayload } from "@/lib/item-payload";

describe("normalizeUrl", () => {
  it("strips tracking params, www, hash, and trailing slash", () => {
    expect(normalizeUrl("https://www.Store.com/p/thing/?utm_source=x&ref=y#top")).toBe(
      "store.com/p/thing",
    );
  });
  it("keeps meaningful query params", () => {
    expect(normalizeUrl("https://store.com/p?variant=blue")).toBe("store.com/p?variant=blue");
  });
  it("returns null for junk", () => {
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
  });
  it("rejects non-http protocols", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(() => cleanHttpUrl("ftp://store.com/item", "Item link")).toThrow(/http/);
  });
});

describe("domainOf", () => {
  it("returns the bare hostname", () => {
    expect(domainOf("https://www.amazon.in/dp/123")).toBe("amazon.in");
    expect(domainOf("")).toBeNull();
  });
});

describe("savingsProgress", () => {
  it("uses target budget when present and caps at 100%", () => {
    const result = savingsProgress({
      target_budget: 100,
      amount_saved: 150,
      current_price: 200,
    } as never);
    expect(result.goal).toBe(100);
    expect(result.pct).toBe(100);
    expect(result.remaining).toBe(0);
  });
  it("falls back to the current price", () => {
    const result = savingsProgress({
      target_budget: null,
      amount_saved: 50,
      current_price: 200,
    } as never);
    expect(result.goal).toBe(200);
    expect(result.pct).toBe(25);
  });
});

describe("item matching and payloads", () => {
  it("matches searchable item fields", () => {
    expect(itemMatchesSearch({ title: "Camera", brand: "Fujifilm" } as never, "fuji")).toBe(true);
    expect(itemMatchesSearch({ title: "Camera", brand: "Fujifilm" } as never, "chair")).toBe(false);
  });

  it("persists purchase fields only for purchased items", () => {
    const purchased = itemPayload({
      ...emptyItemForm,
      title: "Desk",
      status: "purchased",
      purchased_at: "2026-01-02",
      actual_purchase_price: "120",
      purchase_reflection: "Worth it",
    });
    expect(purchased.purchased_at).toBe("2026-01-02");
    expect(purchased.actual_purchase_price).toBe(120);
    expect(purchased.purchase_reflection).toBe("Worth it");

    const active = itemPayload({
      ...emptyItemForm,
      title: "Desk",
      status: "wanted",
      purchased_at: "2026-01-02",
      actual_purchase_price: "120",
      purchase_reflection: "Worth it",
    });
    expect(active.purchased_at).toBeNull();
    expect(active.actual_purchase_price).toBeNull();
    expect(active.purchase_reflection).toBeNull();
  });
});

describe("totalsByCurrency", () => {
  it("groups prices by currency", () => {
    const totals = totalsByCurrency([
      { current_price: 100, currency: "INR" },
      { current_price: 50, currency: "INR" },
      { current_price: 10, currency: "USD" },
    ] as never);
    expect(totals).toEqual([
      { currency: "INR", amount: 150 },
      { currency: "USD", amount: 10 },
    ]);
  });
});

describe("formatMoney", () => {
  it("renders an em dash when there is no amount", () => {
    expect(formatMoney(null, "INR")).toBe("—");
  });
});

describe("parseBackup", () => {
  it("accepts a valid backup", () => {
    const file = parseBackup(
      JSON.stringify({ format: "aspirelist-backup", version: 1, data: { items: [] } }),
    );
    expect(file.version).toBe(1);
  });
  it("rejects invalid JSON, wrong format, and unsupported versions", () => {
    expect(() => parseBackup("{")).toThrow(/valid JSON/);
    expect(() => parseBackup(JSON.stringify({ format: "other", version: 1, data: {} }))).toThrow(
      /AspireList backup/,
    );
    expect(() =>
      parseBackup(JSON.stringify({ format: "aspirelist-backup", version: 9, data: {} })),
    ).toThrow(/isn't supported/);
  });
  it("summarizes backup rows and exports item CSV", () => {
    const file = parseBackup(
      JSON.stringify({
        format: "aspirelist-backup",
        version: 1,
        data: {
          items: [{ title: "Chair", current_price: 25, currency: "USD" }],
          categories: [{ name: "Home" }],
        },
      }),
    );
    expect(backupRowCounts(file).find((row) => row.table === "items")?.count).toBe(1);
    expect(itemsToCsv(file.data["items"] as Record<string, unknown>[])).toContain('"Chair"');
  });
});

describe("ItemForm", () => {
  it("shows purchase fields only when the selected status is purchased", () => {
    const client = new QueryClient();
    const props = {
      values: { ...emptyItemForm, title: "Headphones" },
      onChange: () => undefined,
      onSubmit: () => undefined,
      categories: [],
      collections: [],
      itemId: "item-1",
    };

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <ItemForm {...props} />
      </QueryClientProvider>,
    );
    expect(screen.queryByLabelText(/Purchase date/i)).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={client}>
        <ItemForm {...props} values={{ ...props.values, status: "purchased" }} />
      </QueryClientProvider>,
    );
    expect(screen.getByLabelText(/Purchase date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Actual price paid/i)).toBeInTheDocument();
  });
});
