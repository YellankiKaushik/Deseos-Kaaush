import { describe, expect, it } from "vitest";
import {
  domainOf,
  formatMoney,
  normalizeUrl,
  savingsProgress,
  totalsByCurrency,
} from "@/lib/aspire";
import { parseBackup } from "@/lib/backup";

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
});
