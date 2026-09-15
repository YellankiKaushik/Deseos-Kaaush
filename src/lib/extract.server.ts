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
  warnings: string[];
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
const MAX_RESPONSE_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;

type ImageCandidate = {
  url: string;
  source:
    | "json-ld"
    | "json-ld-graph"
    | "og-image"
    | "og-image-secure"
    | "twitter-image"
    | "schema-image"
    | "img-heuristic";
  score: number;
};

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
  return metaContents(html, attr, key)[0] ?? null;
}

function attrValue(tag: string, attr: string): string | null {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\s${escaped}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return clean(match?.[2]);
}

function tagsNamed(html: string, tagName: string): string[] {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function metaContents(html: string, attr: "property" | "name" | "itemprop", key: string): string[] {
  return tagsNamed(html, "meta")
    .filter((tag) => attrValue(tag, attr)?.toLowerCase() === key.toLowerCase())
    .map((tag) => attrValue(tag, "content"))
    .filter((value): value is string => Boolean(value));
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

function imagesFromValue(value: unknown): string[] {
  if (typeof value === "string") {
    const image = clean(value);
    return image ? [image] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => imagesFromValue(item));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return imagesFromValue(obj["url"] ?? obj["contentUrl"]);
  }
  return [];
}

function absolute(base: URL, value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function normalizeImageUrl(base: URL, value: string | null) {
  const resolved = absolute(base, value);
  if (!resolved) return null;
  const validated = validateUrl(resolved);
  if (!validated.ok) return null;
  validated.url.hash = "";
  validated.url.protocol = validated.url.protocol.toLowerCase();
  validated.url.hostname = validated.url.hostname.toLowerCase();
  return validated.url.toString();
}

function addImageCandidate(
  candidates: ImageCandidate[],
  seen: Set<string>,
  base: URL,
  value: string | null,
  source: ImageCandidate["source"],
  score: number,
) {
  const url = normalizeImageUrl(base, value);
  if (!url || seen.has(url)) return;
  seen.add(url);
  candidates.push({ url, source, score });
}

export function srcsetCandidates(srcset: string | null): string[] {
  if (!srcset) return [];
  return srcset
    .split(",")
    .map((part) => {
      const [url, descriptor] = part.trim().split(/\s+/, 2);
      const width = descriptor?.endsWith("w") ? Number.parseInt(descriptor, 10) : 0;
      return { url: clean(url), width: Number.isFinite(width) ? width : 0 };
    })
    .filter((candidate): candidate is { url: string; width: number } => Boolean(candidate.url))
    .sort((a, b) => b.width - a.width)
    .map((candidate) => candidate.url);
}

function imageHeuristicScore(tag: string, url: string, fallbackScore: number) {
  const haystack = `${tag} ${url}`.toLowerCase();
  if (/logo|icon|sprite|avatar|placeholder|loading|blank|transparent/.test(haystack)) return 0;
  if (/\.svg(?:[?#]|$)|data:image\//.test(haystack)) return 0;

  const width = Number.parseInt(attrValue(tag, "width") ?? "", 10);
  const height = Number.parseInt(attrValue(tag, "height") ?? "", 10);
  let score = fallbackScore;
  if (Number.isFinite(width) && Number.isFinite(height)) {
    if (width < 180 || height < 180) return 0;
    score += Math.min(15, Math.round((width * height) / 100_000));
  }
  if (/product|primary|main|hero|gallery|pdp|image|photo/.test(haystack)) score += 12;
  return score;
}

export function imageCandidatesFromHtml(html: string, baseUrl: string): ImageCandidate[] {
  const base = new URL(baseUrl);
  const candidates: ImageCandidate[] = [];
  const seen = new Set<string>();
  const jsonLdBlocks = collectJsonLd(html);

  for (const block of jsonLdBlocks) {
    const nodes = flattenNodes(block);
    for (const product of nodes.filter((node) => isType(node, "product"))) {
      const source = nodes[0] === product ? "json-ld" : "json-ld-graph";
      for (const image of imagesFromValue(product["image"])) {
        addImageCandidate(candidates, seen, base, image, source, source === "json-ld" ? 100 : 98);
      }
    }
  }

  for (const image of metaContents(html, "property", "og:image")) {
    addImageCandidate(candidates, seen, base, image, "og-image", 90);
  }
  for (const image of metaContents(html, "property", "og:image:secure_url")) {
    addImageCandidate(candidates, seen, base, image, "og-image-secure", 85);
  }
  for (const image of [
    ...metaContents(html, "name", "twitter:image"),
    ...metaContents(html, "property", "twitter:image"),
  ]) {
    addImageCandidate(candidates, seen, base, image, "twitter-image", 80);
  }
  for (const image of [
    ...metaContents(html, "itemprop", "image"),
    ...metaContents(html, "property", "schema:image"),
    ...metaContents(html, "property", "schema:image:url"),
  ]) {
    addImageCandidate(candidates, seen, base, image, "schema-image", 70);
  }
  for (const tag of [...tagsNamed(html, "link"), ...tagsNamed(html, "img")]) {
    if (attrValue(tag, "itemprop")?.toLowerCase() !== "image") continue;
    const image = attrValue(tag, "content") ?? attrValue(tag, "href") ?? attrValue(tag, "src");
    addImageCandidate(candidates, seen, base, image, "schema-image", 70);
  }

  for (const tag of tagsNamed(html, "img")) {
    const urls = [
      ...srcsetCandidates(attrValue(tag, "srcset")),
      attrValue(tag, "data-src"),
      attrValue(tag, "data-original"),
      attrValue(tag, "src"),
    ].filter((value): value is string => Boolean(value));
    for (const image of urls) {
      const normalized = normalizeImageUrl(base, image);
      if (!normalized || seen.has(normalized)) continue;
      const score = imageHeuristicScore(tag, normalized, 45);
      if (score <= 0) continue;
      seen.add(normalized);
      candidates.push({ url: normalized, source: "img-heuristic", score });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function storeNameFromDomain(domain: string | null) {
  if (!domain) return null;
  const core = domain.split(".")[0] ?? domain;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

async function readLimitedText(response: Response) {
  if (!response.body) return (await response.text()).slice(0, MAX_RESPONSE_BYTES);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    size += value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("response_too_large");
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Uint8Array.from(chunks.flatMap((chunk) => [...chunk])));
}

function redirectTarget(current: URL, response: Response) {
  const location = response.headers.get("location");
  if (!location) return null;
  return new URL(location, current);
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
    warnings: [],
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
    let current = url;
    let response: Response | null = null;
    let tooManyRedirects = false;

    try {
      for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
        response = await fetch(current.toString(), {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        if (redirect === MAX_REDIRECTS) {
          tooManyRedirects = true;
          break;
        }
        const target = redirectTarget(current, response);
        if (!target) break;
        const checked = validateUrl(target.toString());
        if (!checked.ok) {
          return { ...base, errorCode: checked.code, errorMessage: checked.message };
        }
        current = checked.url;
      }
    } finally {
      clearTimeout(timer);
    }

    if (!response) throw new Error("network_error");
    base.resolvedUrl = response.url || current.toString();

    if (tooManyRedirects) {
      return {
        ...base,
        errorCode: "too_many_redirects",
        errorMessage: "That page redirects too many times. Add the details manually.",
      };
    }

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
    html = await readLimitedText(response);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const tooLarge = error instanceof Error && error.message === "response_too_large";
    return {
      ...base,
      errorCode: aborted ? "timeout" : tooLarge ? "response_too_large" : "network_error",
      errorMessage: aborted
        ? "The site took too long to respond. Add the details manually."
        : tooLarge
          ? "That page is too large to read safely. Add the details manually."
          : "We couldn't reach that page. Add the details manually.",
    };
  }

  const resolved = new URL(base.resolvedUrl ?? url.toString());
  const methods: string[] = [];
  const imageCandidates = imageCandidatesFromHtml(html, resolved.toString());
  if (imageCandidates[0]) {
    base.imageUrl = imageCandidates[0].url;
  } else {
    base.warnings.push("No usable product image was found.");
  }

  // 1. JSON-LD
  const nodes = collectJsonLd(html).flatMap((block) => flattenNodes(block));
  const product = nodes.find((n) => isType(n, "product"));
  const offer = nodes.find((n) => isType(n, "offer") || isType(n, "aggregateoffer"));
  const aggregateRating = nodes.find((n) => isType(n, "aggregaterating"));

  if (product) {
    methods.push("json-ld");
    base.title = clean(product["name"]) ?? base.title;
    base.description = clean(product["description"]) ?? base.description;
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
  const ogSite = metaContent(html, "property", "og:site_name");
  const ogPrice =
    metaContent(html, "property", "product:price:amount") ??
    metaContent(html, "property", "og:price:amount");
  const ogCurrency =
    metaContent(html, "property", "product:price:currency") ??
    metaContent(html, "property", "og:price:currency");

  if (ogTitle || imageCandidates.some((image) => image.source.startsWith("og-")) || ogPrice)
    methods.push("open-graph");
  base.title = base.title ?? ogTitle;
  base.description = base.description ?? ogDescription;
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
