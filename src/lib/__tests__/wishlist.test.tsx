import { afterEach, describe, expect, it, vi } from "vitest";
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
} from "@/lib/wishlist";
import {
  BACKUP_FORMAT,
  LEGACY_BACKUP_FORMAT,
  backupRowCounts,
  itemsToCsv,
  parseBackup,
} from "@/lib/backup";
import { fetchAndExtract, imageCandidatesFromHtml } from "@/lib/extraction/extract.server";
import { EXTRACTION_FIELDS } from "@/lib/extraction/fields";
import { missingFieldWarnings } from "@/lib/extraction/extraction-ui";
import {
  fetchRemoteImage,
  importRemoteImageForItem,
  imageImportFallbackResult,
  RemoteImageImportError,
} from "@/lib/extraction/image-import.server";
import { itemPayload } from "@/lib/item-payload";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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
  it("accepts the current WishList backup format", () => {
    const file = parseBackup(
      JSON.stringify({ format: BACKUP_FORMAT, version: 1, data: { items: [] } }),
    );
    expect(file.version).toBe(1);
  });
  it("accepts the legacy backup format for restore compatibility", () => {
    const file = parseBackup(
      JSON.stringify({ format: LEGACY_BACKUP_FORMAT, version: 1, data: { items: [] } }),
    );
    expect(file.format).toBe(LEGACY_BACKUP_FORMAT);
  });
  it("rejects invalid JSON, wrong format, and unsupported versions", () => {
    expect(() => parseBackup("{")).toThrow(/valid JSON/);
    expect(() => parseBackup(JSON.stringify({ format: "other", version: 1, data: {} }))).toThrow(
      /WishList backup/,
    );
    expect(() =>
      parseBackup(JSON.stringify({ format: LEGACY_BACKUP_FORMAT, version: 9, data: {} })),
    ).toThrow(/isn't supported/);
  });
  it("summarizes backup rows and exports item CSV", () => {
    const file = parseBackup(
      JSON.stringify({
        format: BACKUP_FORMAT,
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

describe("product image extraction", () => {
  it("reads a JSON-LD string image", () => {
    const images = imageCandidatesFromHtml(
      `<script type="application/ld+json">{"@type":"Product","name":"Lamp","image":"https://cdn.example.com/lamp.jpg"}</script>`,
      "https://shop.example.com/item",
    );
    expect(images[0]?.url).toBe("https://cdn.example.com/lamp.jpg");
  });

  it("reads a JSON-LD array image", () => {
    const images = imageCandidatesFromHtml(
      `<script type="application/ld+json">{"@type":"Product","image":["/small.jpg","/large.jpg"]}</script>`,
      "https://shop.example.com/item",
    );
    expect(images.map((image) => image.url)).toContain("https://shop.example.com/small.jpg");
    expect(images.map((image) => image.url)).toContain("https://shop.example.com/large.jpg");
  });

  it("reads a JSON-LD object image", () => {
    const images = imageCandidatesFromHtml(
      `<script type="application/ld+json">{"@type":"Product","image":{"contentUrl":"//cdn.example.com/object.webp"}}</script>`,
      "https://shop.example.com/item",
    );
    expect(images[0]?.url).toBe("https://cdn.example.com/object.webp");
  });

  it("falls back to og:image", () => {
    const images = imageCandidatesFromHtml(
      `<meta property="og:image" content="https://cdn.example.com/og.png">`,
      "https://shop.example.com/item",
    );
    expect(images[0]?.url).toBe("https://cdn.example.com/og.png");
  });

  it("normalizes a relative image URL", () => {
    const images = imageCandidatesFromHtml(
      `<meta itemprop="image" content="../images/product.jpg">`,
      "https://shop.example.com/products/item",
    );
    expect(images[0]?.url).toBe("https://shop.example.com/images/product.jpg");
  });

  it("rejects invalid and private image URLs", () => {
    expect(
      imageCandidatesFromHtml(
        `<meta property="og:image" content="http://127.0.0.1/private.jpg">`,
        "https://shop.example.com/item",
      ),
    ).toEqual([]);
  });

  it("chooses a suitable srcset candidate from image heuristics", () => {
    const images = imageCandidatesFromHtml(
      `<img class="product-main" srcset="/tiny.jpg 200w, /large.jpg 1200w" src="/fallback.jpg" width="600" height="600">`,
      "https://shop.example.com/item",
    );
    expect(images[0]?.url).toBe("https://shop.example.com/large.jpg");
  });

  it("collects lazy candidates and rejects logo-sized images", () => {
    const images = imageCandidatesFromHtml(
      `
        <img class="site-logo" src="/logo.png" width="80" height="40">
        <img class="product-gallery" data-srcset="/small.jpg 320w, /zoom.jpg 1400w" data-lazy-src="/lazy.jpg" width="900" height="900">
      `,
      "https://shop.example.com/item",
    );
    expect(images.map((image) => image.url)).toContain("https://shop.example.com/zoom.jpg");
    expect(images.map((image) => image.url)).not.toContain("https://shop.example.com/logo.png");
  });
});

describe("product metadata extraction", () => {
  function mockHtmlOnce(html: string, init: ResponseInit = {}) {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(html, {
            status: 200,
            headers: { "content-type": "text/html", ...(init.headers ?? {}) },
            ...init,
          }),
      ),
    );
  }

  it("keeps field names canonical between extraction and UI warnings", () => {
    const fields = Object.fromEntries(EXTRACTION_FIELDS.map(({ key }) => [key, key === "title"]));
    expect(missingFieldWarnings(fields)).toContain("image");
    expect(Object.keys(fields)).toContain("imageUrl");
    expect(Object.keys(fields)).not.toContain("image");
  });

  it("extracts JSON-LD @graph products, aggregate offers, ratings, canonical URL, and images", async () => {
    mockHtmlOnce(`
      <link rel="canonical" href="/products/camera">
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [{
            "@type": ["Product", "Thing"],
            "name": "Graph Camera",
            "brand": {"name": "Kaaush"},
            "description": "A compact camera",
            "image": [{"contentUrl": "/camera-large.webp"}, "/camera-alt.jpg"],
            "aggregateRating": {"ratingValue": "4.7", "reviewCount": "128"},
            "offers": {"@type": "AggregateOffer", "lowPrice": "499.99", "highPrice": "699.99", "priceCurrency": "USD", "availability": "https://schema.org/InStock"}
          }]
        }
      </script>
    `);
    const result = await fetchAndExtract("https://shop.example.com/item");
    expect(result.status).toBe("success");
    expect(result.title).toBe("Graph Camera");
    expect(result.price).toBe(499.99);
    expect(result.originalPrice).toBe(699.99);
    expect(result.currency).toBe("USD");
    expect(result.rating).toBe(4.7);
    expect(result.reviewCount).toBe(128);
    expect(result.canonicalUrl).toBe("https://shop.example.com/products/camera");
    expect(result.imageCandidates.map((image) => image.url)).toContain(
      "https://shop.example.com/camera-large.webp",
    );
    expect(result.fieldsFound.imageUrl).toBe(true);
  });

  it("falls back through Open Graph, Twitter, microdata, and visible price heuristics", async () => {
    mockHtmlOnce(`
      <meta property="og:title" content="OG Headphones">
      <meta property="og:description" content="Noise cancelling">
      <meta property="og:site_name" content="Sound Store">
      <meta property="og:image:secure_url" content="//cdn.example.com/headphones.jpg">
      <meta name="twitter:image:src" content="/twitter.jpg">
      <meta itemprop="priceCurrency" content="INR">
      <span itemprop="price" content="9999"></span>
      <h1>Fallback title</h1>
    `);
    const result = await fetchAndExtract("https://shop.example.com/headphones");
    expect(result.title).toBe("OG Headphones");
    expect(result.description).toBe("Noise cancelling");
    expect(result.storeName).toBe("Sound Store");
    expect(result.price).toBe(9999);
    expect(result.currency).toBe("INR");
    expect(result.imageUrl).toBe("https://cdn.example.com/headphones.jpg");
  });

  it("does not crash on malformed JSON-LD and reports no product metadata", async () => {
    mockHtmlOnce(`<script type="application/ld+json">{ broken</script>`);
    const result = await fetchAndExtract("https://shop.example.com/broken");
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("no_product_metadata");
    expect(result.warnings.join(" ")).toMatch(/malformed|JavaScript/);
  });

  it("classifies non-HTML responses", async () => {
    mockHtmlOnce("{}", { headers: { "content-type": "application/json" } });
    const result = await fetchAndExtract("https://shop.example.com/api");
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("not_html");
  });

  it("retries one safe transient HTTP failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(`<meta property="og:title" content="Retried Lamp">`, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchAndExtract("https://shop.example.com/lamp");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.title).toBe("Retried Lamp");
  });

  it("classifies timeouts", async () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(error)),
    );
    const result = await fetchAndExtract("https://shop.example.com/slow");
    expect(result.errorCode).toBe("timeout");
  });
});

describe("remote image import validation", () => {
  it("rejects non-image Content-Type", async () => {
    await expect(
      fetchRemoteImage("https://cdn.example.com/image", {
        fetchImpl: async () =>
          new Response("<html></html>", { headers: { "content-type": "text/html" } }),
      }),
    ).rejects.toThrow(/JPEG, PNG, or WebP/);
  });

  it("rejects oversized images", async () => {
    await expect(
      fetchRemoteImage("https://cdn.example.com/image.jpg", {
        maxBytes: 4,
        fetchImpl: async () =>
          new Response(new Uint8Array([1, 2, 3, 4, 5]), {
            headers: { "content-type": "image/jpeg" },
          }),
      }),
    ).rejects.toThrow(/larger than the storage limit/);
  });

  it("validates image redirects and sends product-page Referer", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: "/final.jpg" } }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } }),
      );
    const image = await fetchRemoteImage("https://cdn.example.com/image.jpg", {
      fetchImpl,
      referrerUrl: "https://shop.example.com/product",
    });
    expect(image.resolvedUrl).toBe("https://cdn.example.com/final.jpg");
    expect(fetchImpl).toHaveBeenLastCalledWith(
      "https://cdn.example.com/final.jpg",
      expect.objectContaining({
        headers: expect.objectContaining({ Referer: "https://shop.example.com/product" }),
      }),
    );
  });

  it("imports the second candidate when the first image is blocked", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("blocked", { status: 403 }))
        .mockResolvedValueOnce(
          new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/webp" } }),
        ),
    );
    const from = vi.fn((table: string) => {
      if (table === "items") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "item-1", title: "Lamp", image_storage_path: null },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      return {
        delete: () => ({ eq: async () => ({ error: null }) }),
        insert: async () => ({ error: null }),
      };
    });
    const supabase = {
      from,
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          remove: async () => ({ error: null }),
        }),
      },
    };
    const result = await importRemoteImageForItem({
      supabase: supabase as never,
      userId: "user-1",
      itemId: "item-1",
      imageUrl: "https://cdn.example.com/blocked.jpg",
      imageUrls: ["https://cdn.example.com/ok.webp"],
      referrerUrl: "https://shop.example.com/product",
      altText: "Lamp",
    });
    expect(result.sourceUrl).toBe("https://cdn.example.com/ok.webp");
  });

  it("returns a non-throwing fallback result when remote import fails", () => {
    const result = imageImportFallbackResult(
      "https://cdn.example.com/image.jpg",
      ["old warning"],
      new RemoteImageImportError(
        "unsupported_image_type",
        "The extracted image is not a JPEG, PNG, or WebP file.",
      ),
    );
    expect(result).toEqual({
      ok: false,
      storagePath: null,
      sourceUrl: "https://cdn.example.com/image.jpg",
      warnings: ["old warning", "The extracted image is not a JPEG, PNG, or WebP file."],
    });
  });
});
