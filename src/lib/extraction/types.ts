import type { ExtractionFieldsFound } from "@/lib/extraction/fields";

export type ExtractionProvider = "native" | "microlink" | "merged";
export type ExtractionStatus = "success" | "partial" | "failed";

export type ImageCandidate = {
  url: string;
  source:
    | "json-ld"
    | "json-ld-graph"
    | "og-image"
    | "og-image-url"
    | "og-image-secure"
    | "twitter-image"
    | "twitter-image-src"
    | "schema-image"
    | "link-image-src"
    | "srcset"
    | "lazy-image"
    | "img-heuristic"
    | "microlink-image"
    | "microlink-logo";
  score: number;
  width?: number | null;
  height?: number | null;
};

export type ProductExtractionResult = {
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
  imageCandidates: ImageCandidate[];
  method: string;
  provider: ExtractionProvider;
  confidence: number;
  status: ExtractionStatus;
  errorCode?: string;
  errorMessage?: string;
  warnings: string[];
  fieldsFound: ExtractionFieldsFound;
  diagnostics?: {
    nativeStatus?: ExtractionStatus;
    fallbackAttempted?: boolean;
    fallbackStatus?: ExtractionStatus | "skipped";
    fallbackReason?: string | null;
    providerUsed?: ExtractionProvider;
    imageCandidateCount?: number;
  };
};
