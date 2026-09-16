import { emptyFieldsFound, summarizeFields } from "@/lib/extraction/merge-results";
import { validateUrl } from "@/lib/extraction/native-provider.server";
import type { ImageCandidate, ProductExtractionResult } from "@/lib/extraction/types";

const MICROLINK_ENDPOINT = "https://api.microlink.io";
const MICROLINK_TIMEOUT_MS = 8_000;
const MICROLINK_TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

type MicrolinkMedia = {
  url?: unknown;
  width?: unknown;
  height?: unknown;
};

type MicrolinkResponse = {
  status?: unknown;
  statusCode?: unknown;
  message?: unknown;
  data?: {
    title?: unknown;
    description?: unknown;
    url?: unknown;
    publisher?: unknown;
    author?: unknown;
    image?: MicrolinkMedia | string | null;
    logo?: MicrolinkMedia | string | null;
  } | null;
};

function clean(value: unknown, max = 4000) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function storeNameFromDomain(domain: string | null) {
  if (!domain) return null;
  const core = domain.split(".")[0] ?? domain;
  return core.charAt(0).toUpperCase() + core.slice(1);
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
    method: "microlink",
    provider: "microlink",
    confidence: 0,
    status: "failed",
    warnings: [],
    fieldsFound: emptyFieldsFound(),
  };
}

function mediaUrl(media: MicrolinkMedia | string | null | undefined) {
  if (typeof media === "string") return clean(media);
  if (!media || typeof media !== "object") return null;
  return clean(media.url);
}

function mediaDimension(
  media: MicrolinkMedia | string | null | undefined,
  key: "width" | "height",
) {
  if (!media || typeof media !== "object") return null;
  return toNumber(media[key]);
}

function candidateFromMedia(
  media: MicrolinkMedia | string | null | undefined,
  source: ImageCandidate["source"],
  baseUrl: URL,
  score: number,
) {
  const url = mediaUrl(media);
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url, baseUrl);
  } catch {
    return null;
  }
  const checked = validateUrl(parsed.toString());
  if (!checked.ok) return null;
  checked.url.hash = "";
  return {
    url: checked.url.toString(),
    source,
    score,
    width: mediaDimension(media, "width"),
    height: mediaDimension(media, "height"),
  } satisfies ImageCandidate;
}

async function fetchMicrolinkJson(productUrl: URL, fetchImpl: typeof fetch) {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const endpoint = new URL(MICROLINK_ENDPOINT);
    endpoint.searchParams.set("url", productUrl.toString());
    endpoint.searchParams.set("audio", "false");
    endpoint.searchParams.set("video", "false");
    endpoint.searchParams.set("screenshot", "false");
    endpoint.searchParams.set("palette", "false");
    endpoint.searchParams.set("iframe", "false");
    endpoint.searchParams.set("embed", "false");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MICROLINK_TIMEOUT_MS);
    try {
      lastResponse = await fetchImpl(endpoint.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(process.env["MICROLINK_API_KEY"]
            ? { "x-api-key": process.env["MICROLINK_API_KEY"] }
            : {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (MICROLINK_TRANSIENT_STATUS.has(lastResponse.status) && attempt === 0) continue;
    break;
  }

  if (!lastResponse) throw new Error("network_error");
  if (!lastResponse.ok) {
    throw new Error(
      lastResponse.status === 429 ? "fallback_rate_limited" : `http_${lastResponse.status}`,
    );
  }
  return (await lastResponse.json()) as MicrolinkResponse;
}

export async function extractWithMicrolinkProvider(
  rawUrl: string,
  { fetchImpl = fetch }: { fetchImpl?: typeof fetch } = {},
): Promise<ProductExtractionResult> {
  const base = baseResult(rawUrl);
  const checked = validateUrl(rawUrl);
  if (!checked.ok) {
    return { ...base, errorCode: checked.code, errorMessage: checked.message };
  }
  base.domain = checked.url.hostname.replace(/^www\./, "");
  base.storeName = storeNameFromDomain(base.domain);

  let response: MicrolinkResponse;
  try {
    response = await fetchMicrolinkJson(checked.url, fetchImpl);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const code = aborted
      ? "fallback_timeout"
      : error instanceof Error
        ? error.message
        : "fallback_error";
    return {
      ...base,
      errorCode: code,
      errorMessage: "Browser-backed extraction was unavailable.",
      diagnostics: { fallbackAttempted: true, fallbackStatus: "failed", providerUsed: "microlink" },
    };
  }

  if (response.status !== "success" || !response.data) {
    return {
      ...base,
      errorCode: response.statusCode === 429 ? "fallback_rate_limited" : "fallback_unavailable",
      errorMessage: clean(response.message) ?? "Browser-backed extraction did not return details.",
      diagnostics: { fallbackAttempted: true, fallbackStatus: "failed", providerUsed: "microlink" },
    };
  }

  const data = response.data;
  base.resolvedUrl = clean(data.url) ?? checked.url.toString();
  base.canonicalUrl = base.resolvedUrl;
  const resolved = validateUrl(base.resolvedUrl);
  if (resolved.ok) {
    base.domain = resolved.url.hostname.replace(/^www\./, "");
    base.storeName = clean(data.publisher) ?? storeNameFromDomain(base.domain);
  } else {
    base.storeName = clean(data.publisher) ?? base.storeName;
  }
  base.title = clean(data.title, 220);
  base.description = clean(data.description);
  base.brand = clean(data.author);

  const baseForMedia = resolved.ok ? resolved.url : checked.url;
  const candidates: ImageCandidate[] = [];
  const mainImage = candidateFromMedia(data.image, "microlink-image", baseForMedia, 104);
  const logoImage = candidateFromMedia(data.logo, "microlink-logo", baseForMedia, 40);
  if (mainImage) candidates.push(mainImage);
  if (logoImage) candidates.push(logoImage);
  base.imageCandidates = candidates;
  base.imageUrl = candidates[0]?.url ?? null;

  summarizeFields(base);
  if (base.title || base.imageUrl || base.description) {
    base.status = base.confidence >= 70 ? "success" : "partial";
  } else {
    base.status = "failed";
    base.errorCode = "fallback_no_metadata";
    base.errorMessage = "Browser-backed extraction did not find product details.";
  }
  if (!base.price) {
    base.warnings.push(
      "Browser-backed metadata usually cannot read structured price details without native product data.",
    );
  }
  base.diagnostics = {
    fallbackAttempted: true,
    fallbackStatus: base.status,
    providerUsed: "microlink",
    imageCandidateCount: base.imageCandidates.length,
  };

  return base;
}
