/**
 * Layered product extraction: JSON-LD -> Open Graph -> Twitter -> schema.org -> HTML -> DOM.
 * Server-only. Never trust extraction; the UI always allows manual correction.
 */

import {
  EXTRACTION_FIELDS,
  type ExtractionFieldKey,
  type ExtractionFieldsFound,
} from "@/lib/extraction/fields";
import type { ImageCandidate, ProductExtractionResult } from "@/lib/extraction/types";

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
const FETCH_TIMEOUT_MS = 12_000;
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);

function emptyFieldsFound(): ExtractionFieldsFound {
  return Object.fromEntries(
    EXTRACTION_FIELDS.map(({ key }) => [key, false]),
  ) as ExtractionFieldsFound;
}

function baseResult(rawUrl: string): ProductExtractionResult {
  return {
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
    imageCandidates: [],
    method: "none",
    provider: "native",
    confidence: 0,
    status: "failed",
    warnings: [],
    fieldsFound: emptyFieldsFound(),
  };
}

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
      message: "That does not look like a valid web address.",
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
    return { ok: false, code: "blocked_host", message: "That address cannot be fetched." };
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
    .replace(/&#x([a-f\d]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

function clean(value: unknown, max = 4000): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = decodeEntities(String(value).replace(/\s+/g, " "));
  return text.length ? text.slice(0, max) : null;
}

function firstClean(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.replace(/[\s,](?=\d{3}\b)/g, "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const num = Number(match[0].replace(",", "."));
  return Number.isFinite(num) ? num : null;
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

function metaContent(
  html: string,
  attr: "property" | "name" | "itemprop",
  key: string,
): string | null {
  return metaContents(html, attr, key)[0] ?? null;
}

function itempropValue(html: string, key: string): string | null {
  const tag = (html.match(/<[^>]+>/g) ?? []).find(
    (candidate) => attrValue(candidate, "itemprop")?.toLowerCase() === key.toLowerCase(),
  );
  return tag
    ? (attrValue(tag, "content") ?? attrValue(tag, "href") ?? attrValue(tag, "src"))
    : null;
}

function linkByRel(html: string, relName: string) {
  const rel = relName.toLowerCase();
  return tagsNamed(html, "link").find((tag) =>
    (attrValue(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes(rel),
  );
}

function collectJsonLd(html: string, warnings?: string[]): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = decodeEntities((match[1] ?? "").trim());
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      warnings?.push("Some structured product data was malformed.");
    }
  }
  return blocks;
}

function flattenNodes(
  node: unknown,
  out: Record<string, unknown>[] = [],
  depth = 0,
): Record<string, unknown>[] {
  if (depth > 8) return out;
  if (Array.isArray(node)) {
    node.forEach((child) => flattenNodes(child, out, depth + 1));
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    out.push(obj);
    for (const key of [
      "@graph",
      "offers",
      "mainEntity",
      "itemListElement",
      "hasVariant",
      "isVariantOf",
    ]) {
      if (obj[key]) flattenNodes(obj[key], out, depth + 1);
    }
  }
  return out;
}

function typeTokens(node: Record<string, unknown>) {
  const type = node["@type"];
  if (typeof type === "string") return [type.toLowerCase()];
  if (Array.isArray(type))
    return type.filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase());
  return [];
}

function isType(node: Record<string, unknown>, type: string) {
  const needle = type.toLowerCase();
  return typeTokens(node).some((value) => value === needle || value.endsWith(`/${needle}`));
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function imagesFromValue(value: unknown): string[] {
  if (typeof value === "string") {
    const image = clean(value);
    return image ? [image] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => imagesFromValue(item));
  const obj = objectValue(value);
  if (obj) return imagesFromValue(obj["url"] ?? obj["contentUrl"] ?? obj["@id"]);
  return [];
}

function absolute(base: URL, value: string | null): string | null {
  if (!value || /^data:/i.test(value)) return null;
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

function looksLikeBadImage(tagAndUrl: string) {
  const haystack = tagAndUrl.toLowerCase();
  return (
    /logo|icon|sprite|avatar|placeholder|loading|blank|transparent|tracking|pixel|favicon/.test(
      haystack,
    ) || /\.svg(?:[?#]|$)|data:image\//.test(haystack)
  );
}

function declaredDimension(tag: string, name: "width" | "height") {
  const value = Number.parseInt(attrValue(tag, name) ?? "", 10);
  return Number.isFinite(value) ? value : null;
}

function addImageCandidate(
  candidates: ImageCandidate[],
  seen: Set<string>,
  base: URL,
  value: string | null,
  source: ImageCandidate["source"],
  score: number,
  dimensions: { width?: number | null; height?: number | null } = {},
) {
  const url = normalizeImageUrl(base, value);
  if (!url || seen.has(url) || looksLikeBadImage(url)) return;
  if (
    (dimensions.width && dimensions.width < 160) ||
    (dimensions.height && dimensions.height < 160)
  )
    return;
  seen.add(url);
  const area = dimensions.width && dimensions.height ? dimensions.width * dimensions.height : 0;
  const dimensionBoost = area ? Math.min(16, Math.round(area / 120_000)) : 0;
  const fullResBoost = /(_large|large|1200|1500|2000|original|zoom|main|pdp)/i.test(url) ? 6 : 0;
  candidates.push({ url, source, score: score + dimensionBoost + fullResBoost, ...dimensions });
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
  if (looksLikeBadImage(haystack)) return 0;
  const width = declaredDimension(tag, "width");
  const height = declaredDimension(tag, "height");
  let score = fallbackScore;
  if (width && height) {
    if (width < 160 || height < 160) return 0;
    score += Math.min(16, Math.round((width * height) / 120_000));
  }
  if (/product|primary|main|hero|gallery|pdp|zoom|image|photo/.test(haystack)) score += 14;
  if (/thumb|thumbnail|swatch|badge/.test(haystack)) score -= 10;
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
        addImageCandidate(candidates, seen, base, image, source, source === "json-ld" ? 112 : 108);
      }
    }
  }

  const ogWidth = toNumber(metaContent(html, "property", "og:image:width"));
  const ogHeight = toNumber(metaContent(html, "property", "og:image:height"));
  for (const image of metaContents(html, "property", "og:image")) {
    addImageCandidate(candidates, seen, base, image, "og-image", 96, {
      width: ogWidth,
      height: ogHeight,
    });
  }
  for (const image of metaContents(html, "property", "og:image:url")) {
    addImageCandidate(candidates, seen, base, image, "og-image-url", 95, {
      width: ogWidth,
      height: ogHeight,
    });
  }
  for (const image of metaContents(html, "property", "og:image:secure_url")) {
    addImageCandidate(candidates, seen, base, image, "og-image-secure", 94, {
      width: ogWidth,
      height: ogHeight,
    });
  }
  for (const image of [
    ...metaContents(html, "name", "twitter:image"),
    ...metaContents(html, "property", "twitter:image"),
  ]) {
    addImageCandidate(candidates, seen, base, image, "twitter-image", 88);
  }
  for (const image of [
    ...metaContents(html, "name", "twitter:image:src"),
    ...metaContents(html, "property", "twitter:image:src"),
  ]) {
    addImageCandidate(candidates, seen, base, image, "twitter-image-src", 87);
  }
  for (const image of [
    ...metaContents(html, "itemprop", "image"),
    ...metaContents(html, "property", "schema:image"),
    ...metaContents(html, "property", "schema:image:url"),
  ]) {
    addImageCandidate(candidates, seen, base, image, "schema-image", 82);
  }
  const imageSrc = linkByRel(html, "image_src");
  if (imageSrc)
    addImageCandidate(candidates, seen, base, attrValue(imageSrc, "href"), "link-image-src", 78);

  for (const tag of [...tagsNamed(html, "link"), ...tagsNamed(html, "img")]) {
    if (attrValue(tag, "itemprop")?.toLowerCase() !== "image") continue;
    const image = attrValue(tag, "content") ?? attrValue(tag, "href") ?? attrValue(tag, "src");
    addImageCandidate(candidates, seen, base, image, "schema-image", 82);
  }

  for (const tag of tagsNamed(html, "img")) {
    const width = declaredDimension(tag, "width");
    const height = declaredDimension(tag, "height");
    for (const image of [
      ...srcsetCandidates(attrValue(tag, "srcset")),
      ...srcsetCandidates(attrValue(tag, "data-srcset")),
    ]) {
      addImageCandidate(
        candidates,
        seen,
        base,
        image,
        "srcset",
        imageHeuristicScore(tag, image, 62),
        { width, height },
      );
    }
    for (const [image, source] of [
      [attrValue(tag, "data-src"), "lazy-image"],
      [attrValue(tag, "data-original"), "lazy-image"],
      [attrValue(tag, "data-lazy-src"), "lazy-image"],
      [attrValue(tag, "data-zoom-image"), "lazy-image"],
      [attrValue(tag, "src"), "img-heuristic"],
    ] as const) {
      addImageCandidate(
        candidates,
        seen,
        base,
        image,
        source,
        image ? imageHeuristicScore(tag, image, source === "lazy-image" ? 58 : 48) : 0,
        { width, height },
      );
    }
  }

  return candidates.filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
}

function storeNameFromDomain(domain: string | null) {
  if (!domain) return null;
  const core = domain.split(".")[0] ?? domain;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

function concatChunks(chunks: Uint8Array[], totalSize: number) {
  const merged = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

async function readLimitedText(response: Response) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error("response_too_large");
  }
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
  return new TextDecoder().decode(concatChunks(chunks, size));
}

function redirectTarget(current: URL, response: Response) {
  const location = response.headers.get("location");
  if (!location) return null;
  return new URL(location, current);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(startUrl: URL) {
  let lastResponse: Response | null = null;
  let current = startUrl;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      current = startUrl;
      for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
        lastResponse = await fetch(current.toString(), {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
          },
        });

        if (!REDIRECT_STATUS.has(lastResponse.status)) break;
        if (redirect === MAX_REDIRECTS) {
          return {
            ok: false as const,
            code: "too_many_redirects",
            message: "That page redirects too many times. You can still save the link manually.",
            resolvedUrl: current.toString(),
          };
        }
        const target = redirectTarget(current, lastResponse);
        if (!target) break;
        const checked = validateUrl(target.toString());
        if (!checked.ok) {
          return {
            ok: false as const,
            code: checked.code,
            message: checked.message,
            resolvedUrl: current.toString(),
          };
        }
        current = checked.url;
      }
    } finally {
      clearTimeout(timer);
    }

    if (lastResponse && TRANSIENT_STATUS.has(lastResponse.status) && attempt === 0) {
      await sleep(300);
      continue;
    }
    break;
  }

  if (!lastResponse) {
    return {
      ok: false as const,
      code: "network_error",
      message: "We could not reach that page. You can still save the link manually.",
      resolvedUrl: current.toString(),
    };
  }
  const resolvedUrl = lastResponse.url || current.toString();

  if (!lastResponse.ok) {
    const blocked = lastResponse.status === 401 || lastResponse.status === 403;
    const rateLimited = lastResponse.status === 429;
    return {
      ok: false as const,
      code: blocked ? "blocked" : rateLimited ? "rate_limited" : `http_${lastResponse.status}`,
      message: blocked
        ? "This store blocked automatic reading. You can still save the link and fill in anything missing."
        : rateLimited
          ? "This store asked us to slow down. Try again in a moment, or save it manually."
          : `The page returned an error (${lastResponse.status}). You can still save it manually.`,
      resolvedUrl,
    };
  }

  const contentType = lastResponse.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("xml") && contentType !== "") {
    return {
      ok: false as const,
      code: "not_html",
      message: "That link is not a product page we can read. You can still save it manually.",
      resolvedUrl,
    };
  }

  const html = await readLimitedText(lastResponse);
  return { ok: true as const, html, resolvedUrl };
}

function bestProduct(nodes: Record<string, unknown>[]) {
  return (
    nodes
      .filter((node) => isType(node, "product"))
      .sort((a, b) => productScore(b) - productScore(a))[0] ?? null
  );
}

function productScore(node: Record<string, unknown>) {
  return [
    node["name"],
    node["offers"],
    node["image"],
    node["brand"],
    node["aggregateRating"],
    node["description"],
  ].filter(Boolean).length;
}

function offerNodes(product: Record<string, unknown> | null, nodes: Record<string, unknown>[]) {
  const fromProduct = product
    ? flattenNodes(product["offers"]).filter(
        (node) => isType(node, "offer") || isType(node, "aggregateoffer"),
      )
    : [];
  const global = nodes.filter((node) => isType(node, "offer") || isType(node, "aggregateoffer"));
  return [...fromProduct, ...global];
}

function offerData(offers: Record<string, unknown>[]) {
  let price: number | null = null;
  let originalPrice: number | null = null;
  let currency: string | null = null;
  let availability: string | null = null;

  for (const offer of offers) {
    const specs = flattenNodes(offer["priceSpecification"]).filter(
      (node) => node["price"] || node["priceCurrency"],
    );
    price = price ?? toNumber(offer["price"] ?? offer["lowPrice"] ?? specs[0]?.["price"]);
    const highPrice = toNumber(offer["highPrice"]);
    if (highPrice != null && (price == null || highPrice > price))
      originalPrice = originalPrice ?? highPrice;
    currency = currency ?? firstClean(offer["priceCurrency"], specs[0]?.["priceCurrency"]);
    const rawAvailability = firstClean(offer["availability"]);
    availability = availability ?? rawAvailability?.split("/").pop() ?? null;
  }

  return { price, originalPrice, currency, availability };
}

function currencyFromSymbol(text: string | null) {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith("₹") || /^Rs/i.test(trimmed)) return "INR";
  if (trimmed.startsWith("$")) return "USD";
  if (trimmed.startsWith("€")) return "EUR";
  if (trimmed.startsWith("£")) return "GBP";
  if (/^AED/i.test(trimmed)) return "AED";
  return null;
}

function htmlTitle(html: string) {
  return clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 220);
}

function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function applyFieldSummary(product: ProductExtractionResult) {
  const values: Record<ExtractionFieldKey, boolean> = {
    title: Boolean(product.title),
    brand: Boolean(product.brand),
    description: Boolean(product.description),
    price: product.price !== null,
    originalPrice: product.originalPrice !== null,
    currency: Boolean(product.currency),
    rating: product.rating !== null,
    reviewCount: product.reviewCount !== null,
    availability: Boolean(product.availability),
    storeName: Boolean(product.storeName),
    canonicalUrl: Boolean(product.canonicalUrl),
    imageUrl: Boolean(product.imageUrl),
  };
  product.fieldsFound = values;
  product.confidence = EXTRACTION_FIELDS.reduce(
    (total, field) => total + (values[field.key] ? field.weight : 0),
    0,
  );
}

export async function extractWithNativeProvider(rawUrl: string): Promise<ProductExtractionResult> {
  const base = baseResult(rawUrl);
  const validated = validateUrl(rawUrl);
  if (!validated.ok) return { ...base, errorCode: validated.code, errorMessage: validated.message };

  const requestedUrl = validated.url;
  base.domain = requestedUrl.hostname.replace(/^www\./, "");
  base.storeName = storeNameFromDomain(base.domain);

  let fetched: Awaited<ReturnType<typeof fetchHtml>>;
  try {
    fetched = await fetchHtml(requestedUrl);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const tooLarge = error instanceof Error && error.message === "response_too_large";
    return {
      ...base,
      errorCode: aborted ? "timeout" : tooLarge ? "response_too_large" : "network_error",
      errorMessage: aborted
        ? "The store took too long to respond. You can still save the link and fill in anything missing."
        : tooLarge
          ? "That page is too large to read safely. You can still save it manually."
          : "We could not reach that page. You can still save the link manually.",
    };
  }

  base.resolvedUrl = fetched.resolvedUrl;
  if (!fetched.ok) {
    return {
      ...base,
      resolvedUrl: fetched.resolvedUrl,
      errorCode: fetched.code,
      errorMessage: fetched.message,
    };
  }

  const resolved = new URL(fetched.resolvedUrl);
  const html = fetched.html;
  const methods: string[] = [];
  const jsonWarnings: string[] = [];
  const jsonLdBlocks = collectJsonLd(html, jsonWarnings);
  base.warnings.push(...jsonWarnings);
  const nodes = jsonLdBlocks.flatMap((block) => flattenNodes(block));
  const product = bestProduct(nodes);
  const offers = offerNodes(product, nodes);
  const aggregateRating =
    objectValue(product?.["aggregateRating"]) ??
    nodes.find((node) => isType(node, "aggregaterating")) ??
    null;

  const imageCandidates = imageCandidatesFromHtml(html, resolved.toString());
  base.imageCandidates = imageCandidates.slice(0, 8);
  base.imageUrl = imageCandidates[0]?.url ?? null;
  if (!base.imageUrl) base.warnings.push("No usable product image was found.");

  if (product) {
    methods.push("json-ld");
    base.title = firstClean(product["name"]);
    base.description = firstClean(product["description"]);
    const brand = product["brand"];
    const brandObject = objectValue(brand);
    base.brand = firstClean(brandObject?.["name"], brand);
    if (aggregateRating) {
      base.rating = toNumber(aggregateRating["ratingValue"]);
      base.reviewCount = toNumber(aggregateRating["reviewCount"] ?? aggregateRating["ratingCount"]);
    }
  }
  const offer = offerData(offers);
  if (offer.price !== null || offer.currency || offer.availability) {
    if (!methods.includes("json-ld")) methods.push("json-ld");
    base.price = offer.price ?? base.price;
    base.originalPrice = offer.originalPrice ?? base.originalPrice;
    base.currency = offer.currency ?? base.currency;
    base.availability = offer.availability ?? base.availability;
  }

  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const ogSite = metaContent(html, "property", "og:site_name");
  const ogPrice =
    metaContent(html, "property", "product:price:amount") ??
    metaContent(html, "property", "og:price:amount");
  const ogCurrency =
    metaContent(html, "property", "product:price:currency") ??
    metaContent(html, "property", "og:price:currency");
  const ogAvailability = metaContent(html, "property", "product:availability");
  if (ogTitle || ogPrice || imageCandidates.some((image) => image.source.startsWith("og-")))
    methods.push("open-graph");
  base.title = base.title ?? ogTitle;
  base.description = base.description ?? ogDescription;
  base.storeName = ogSite ?? base.storeName;
  base.price = base.price ?? toNumber(ogPrice);
  base.currency = base.currency ?? ogCurrency;
  base.availability = base.availability ?? ogAvailability;

  const twitterTitle =
    metaContent(html, "name", "twitter:title") ?? metaContent(html, "property", "twitter:title");
  const twitterDescription =
    metaContent(html, "name", "twitter:description") ??
    metaContent(html, "property", "twitter:description");
  if (
    twitterTitle ||
    twitterDescription ||
    imageCandidates.some((image) => image.source.startsWith("twitter-"))
  ) {
    methods.push("twitter-card");
  }
  base.title = base.title ?? twitterTitle;
  base.description = base.description ?? twitterDescription;

  const itemName = metaContent(html, "itemprop", "name") ?? itempropValue(html, "name");
  const itemPrice = metaContent(html, "itemprop", "price") ?? itempropValue(html, "price");
  const itemCurrency =
    metaContent(html, "itemprop", "priceCurrency") ?? itempropValue(html, "priceCurrency");
  if (itemName || itemPrice || imageCandidates.some((image) => image.source === "schema-image"))
    methods.push("schema");
  base.title = base.title ?? itemName;
  base.price = base.price ?? toNumber(itemPrice);
  base.currency = base.currency ?? itemCurrency;

  const canonicalTag = linkByRel(html, "canonical");
  const canonicalHref = canonicalTag ? attrValue(canonicalTag, "href") : null;
  const metaDescription = metaContent(html, "name", "description");
  if (htmlTitle(html) || metaDescription) methods.push("html-meta");
  base.title = base.title ?? htmlTitle(html);
  base.description = base.description ?? metaDescription;
  base.canonicalUrl = absolute(resolved, canonicalHref) ?? base.resolvedUrl;

  const h1 = clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " "), 220);
  const productTitle = clean(
    html
      .match(
        /<[^>]+(?:class|id)=["'][^"']*(?:product|pdp|title)[^"']*["'][^>]*>([\s\S]{1,400}?)<\/[^>]+>/i,
      )?.[1]
      ?.replace(/<[^>]+>/g, " "),
    220,
  );
  if (!base.title && (h1 || productTitle)) methods.push("heuristic");
  base.title = base.title ?? productTitle ?? h1;

  if (base.price === null) {
    const dataPrice = html.match(
      /data-(?:price|product-price|sale-price)[^=]*=["']([^"']+)["']/i,
    )?.[1];
    const symbolMatch = decodeEntities(visibleText(html)).match(
      /(?:₹|Rs\.?|\$|€|£|AED)\s?\d[\d.,]{1,12}/,
    );
    const guess = itemPrice ?? dataPrice ?? symbolMatch?.[0] ?? null;
    base.price = toNumber(guess);
    if (base.price !== null) {
      methods.push("heuristic");
      base.currency = base.currency ?? currencyFromSymbol(symbolMatch?.[0] ?? null);
    }
  }

  if (base.title) base.title = base.title.slice(0, 220);
  base.method = methods.length ? [...new Set(methods)].join("+") : "none";
  applyFieldSummary(base);

  if (!base.title) {
    base.status = "failed";
    base.errorCode = "no_product_metadata";
    base.errorMessage =
      "We could not read this store automatically. You can still save the link and fill in anything missing.";
    if (html.length > 0 && !jsonLdBlocks.length && !ogTitle && !htmlTitle(html)) {
      base.warnings.push("This page may render product details with JavaScript only.");
    }
  } else if (base.confidence >= 70) {
    base.status = "success";
  } else {
    base.status = "partial";
    if (base.price === null && !base.imageUrl) {
      base.errorCode = "partial_metadata";
      base.errorMessage =
        "We found the product, but the store did not share a price or usable image.";
    }
  }

  return base;
}
