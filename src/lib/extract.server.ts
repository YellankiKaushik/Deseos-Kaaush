/**
 * Layered product extraction: JSON-LD -> Open Graph -> HTML metadata -> DOM heuristics.
 * Server-only. Never trust extraction; the UI always allows manual correction.
 */

export type ExtractedProduct = {
  requestedUrl: string;
  resolvedUrl: string | null;
  canonicalUrl: string | null;
  domain: string | null;
  storeName: string | null;
  title: string | null;
  brand: string | null;
  description: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string | null;
  rating: number | null;
  reviewCount: number | null;
  availability: string | null;
  imageUrl: string | null;
  method: string;
  confidence: number;
  status: "success" | "partial" | "failed";
  errorCode?: string;
  errorMessage?: string;
  fieldsFound: Record<string, boolean>;
};

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /\.local$/i,
  /^\[?::1\]?$/,
  /^\[?f[cd]/i,
  /metadata\.google\.internal$/i,
];

export function validateUrl(
  raw: string,
): { ok: true; url: URL } | { ok: false; code: string; message: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return {
      ok: false,
      code: "invalid_url",
      message: "That doesn't look like a valid web address.",
    };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      code: "unsupported_protocol",
      message: "Only http and https links are supported.",
    };
  }
  const host = url.hostname;
  if (BLOCKED_HOST_PATTERNS.some((p) => p.test(host)) || !host.includes(".")) {
    return { ok: false, code: "blocked_host", message: "That address can't be fetched." };
  }
  return { ok: true, url };
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = decodeEntities(value.replace(/\s+/g, " "));
  return text.length ? text.slice(0, 4000) : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.replace(/[\s,](?=\d{3}\b)/g, "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const num = Number(match[0].replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function metaContent(
  html: string,
  attr: "property" | "name" | "itemprop",
  key: string,
): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
  return clean(content);
}

function collectJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = (match[1] ?? "").trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      /* ignore malformed blocks */
    }
  }
  return blocks;
}

function flattenNodes(
  node: unknown,
  out: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => flattenNodes(child, out));
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    out.push(obj);
    if (obj["@graph"]) flattenNodes(obj["@graph"], out);
    if (obj["offers"]) flattenNodes(obj["offers"], out);
    if (obj["mainEntity"]) flattenNodes(obj["mainEntity"], out);
  }
  return out;
}

function isType(node: Record<string, unknown>, type: string) {
  const t = node["@type"];
  if (typeof t === "string") return t.toLowerCase().includes(type);
  if (Array.isArray(t))
    return t.some((v) => typeof v === "string" && v.toLowerCase().includes(type));
  return false;
}

function firstImage(value: unknown): string | null {
  if (typeof value === "string") return clean(value);
  if (Array.isArray(value)) return firstImage(value[0]);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return firstImage(obj["url"] ?? obj["contentUrl"]);
  }
  return null;
}

function absolute(base: URL, value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function storeNameFromDomain(domain: string | null) {
  if (!domain) return null;
  const core = domain.split(".")[0] ?? domain;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

export async function fetchAndExtract(rawUrl: string): Promise<ExtractedProduct> {
  const base: ExtractedProduct = {
    requestedUrl: rawUrl,
    resolvedUrl: null,
    canonicalUrl: null,
    domain: null,
    storeName: null,
    title: null,
    brand: null,
    description: null,
    price: null,
    originalPrice: null,
    currency: null,
    rating: null,
    reviewCount: null,
    availability: null,
    imageUrl: null,
    method: "none",
    confidence: 0,
    status: "failed",
    fieldsFound: {},
  };

  const validated = validateUrl(rawUrl);
  if (!validated.ok) {
    return { ...base, errorCode: validated.code, errorMessage: validated.message };
  }
  const url = validated.url;
  base.domain = url.hostname.replace(/^www\./, "");
  base.storeName = storeNameFromDomain(base.domain);

  let html = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);
    base.resolvedUrl = response.url || url.toString();

    if (!response.ok) {
      return {
        ...base,
        errorCode:
          response.status === 403 || response.status === 401
            ? "blocked"
            : `http_${response.status}`,
        errorMessage:
          response.status === 403 || response.status === 401
            ? "This site blocks automated requests. Add the details manually."
            : `The page returned an error (${response.status}).`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("xml") && contentType !== "") {
      return {
        ...base,
        errorCode: "not_html",
        errorMessage: "That link isn't a web page we can read.",
      };
    }
    html = (await response.text()).slice(0, 2_000_000);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ...base,
      errorCode: aborted ? "timeout" : "network_error",
      errorMessage: aborted
        ? "The site took too long to respond. Add the details manually."
        : "We couldn't reach that page. Add the details manually.",
    };
  }

  const resolved = new URL(base.resolvedUrl ?? url.toString());
  const methods: string[] = [];

  // 1. JSON-LD
  const nodes = collectJsonLd(html).flatMap((block) => flattenNodes(block));
  const product = nodes.find((n) => isType(n, "product"));
  const offer = nodes.find((n) => isType(n, "offer") || isType(n, "aggregateoffer"));
  const aggregateRating = nodes.find((n) => isType(n, "aggregaterating"));

  if (product) {
    methods.push("json-ld");
    base.title = clean(product["name"]) ?? base.title;
    base.description = clean(product["description"]) ?? base.description;
    base.imageUrl = absolute(resolved, firstImage(product["image"])) ?? base.imageUrl;
    const brand = product["brand"];
    base.brand =
      clean(
        typeof brand === "object" && brand ? (brand as Record<string, unknown>)["name"] : brand,
      ) ?? base.brand;
    const rating = product["aggregateRating"] as Record<string, unknown> | undefined;
    if (rating) {
      base.rating = toNumber(rating["ratingValue"]);
      base.reviewCount = toNumber(rating["reviewCount"] ?? rating["ratingCount"]);
    }
  }
  if (aggregateRating && base.rating === null) {
    base.rating = toNumber(aggregateRating["ratingValue"]);
    base.reviewCount = toNumber(aggregateRating["reviewCount"] ?? aggregateRating["ratingCount"]);
  }
  if (offer) {
    if (!methods.includes("json-ld")) methods.push("json-ld");
    base.price = toNumber(offer["price"] ?? offer["lowPrice"]) ?? base.price;
    base.currency = clean(offer["priceCurrency"]) ?? base.currency;
    const availability = clean(offer["availability"]);
    if (availability) base.availability = availability.split("/").pop() ?? availability;
  }

  // 2. Open Graph
  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const ogImage =
    metaContent(html, "property", "og:image:secure_url") ??
    metaContent(html, "property", "og:image") ??
    metaContent(html, "name", "twitter:image");
  const ogSite = metaContent(html, "property", "og:site_name");
  const ogPrice =
    metaContent(html, "property", "product:price:amount") ??
    metaContent(html, "property", "og:price:amount");
  const ogCurrency =
    metaContent(html, "property", "product:price:currency") ??
    metaContent(html, "property", "og:price:currency");

  if (ogTitle || ogImage || ogPrice) methods.push("open-graph");
  base.title = base.title ?? ogTitle;
  base.description = base.description ?? ogDescription;
  base.imageUrl = base.imageUrl ?? absolute(resolved, ogImage);
  base.storeName = ogSite ?? base.storeName;
  base.price = base.price ?? toNumber(ogPrice);
  base.currency = base.currency ?? ogCurrency;

  // 3. Standard HTML metadata
  const metaDescription = metaContent(html, "name", "description");
  const htmlTitle = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0];
  const canonicalHref = canonical ? clean(canonical.match(/href=["']([^"']+)["']/i)?.[1]) : null;
  if (htmlTitle || metaDescription) methods.push("html-meta");
  base.title = base.title ?? htmlTitle;
  base.description = base.description ?? metaDescription;
  base.canonicalUrl = absolute(resolved, canonicalHref) ?? base.resolvedUrl;

  // 4. DOM heuristics
  if (base.price === null) {
    const itempropPrice = metaContent(html, "itemprop", "price");
    const priceAttr = html.match(/data-(?:price|product-price)[^=]*=["']([^"']+)["']/i)?.[1];
    const visible = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    const symbolMatch = decodeEntities(visible).match(/(?:₹|Rs\.?|\$|€|£|AED)\s?\d[\d.,]{1,12}/);
    const guess = itempropPrice ?? priceAttr ?? symbolMatch?.[0] ?? null;
    if (guess) {
      base.price = toNumber(guess);
      if (base.price !== null) methods.push("heuristic");
      if (!base.currency && symbolMatch) {
        const symbol = symbolMatch[0].trim()[0];
        base.currency =
          symbol === "₹" || /^Rs/i.test(symbolMatch[0])
            ? "INR"
            : symbol === "$"
              ? "USD"
              : symbol === "€"
                ? "EUR"
                : symbol === "£"
                  ? "GBP"
                  : null;
      }
    }
  }

  if (base.title) base.title = base.title.slice(0, 220);

  const fieldsFound = {
    title: Boolean(base.title),
    price: base.price !== null,
    currency: Boolean(base.currency),
    image: Boolean(base.imageUrl),
    brand: Boolean(base.brand),
    description: Boolean(base.description),
    rating: base.rating !== null,
  };
  base.fieldsFound = fieldsFound;

  const weights: Record<keyof typeof fieldsFound, number> = {
    title: 35,
    price: 25,
    currency: 5,
    image: 20,
    brand: 5,
    description: 5,
    rating: 5,
  };
  base.confidence = (Object.keys(fieldsFound) as (keyof typeof fieldsFound)[]).reduce(
    (total, key) => total + (fieldsFound[key] ? weights[key] : 0),
    0,
  );
  base.method = methods.length ? [...new Set(methods)].join("+") : "none";

  if (!base.title) {
    base.status = "failed";
    base.errorCode = "no_data";
    base.errorMessage = "We couldn't read this page. Add the details manually — it takes a moment.";
  } else if (base.confidence >= 70) {
    base.status = "success";
  } else {
    base.status = "partial";
  }

  return base;
}
