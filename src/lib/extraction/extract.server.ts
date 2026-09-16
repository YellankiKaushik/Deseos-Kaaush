/**
 * Product extraction orchestrator.
 *
 * Native extraction is always first. Microlink is an optional browser-backed fallback used only
 * when native fetching/parsing is blocked or too incomplete for the link-first flow.
 */

import {
  fallbackReason,
  mergeExtractionResults,
  shouldUseFallback,
} from "@/lib/extraction/merge-results";
import { extractWithMicrolinkProvider } from "@/lib/extraction/microlink-provider.server";
import {
  extractWithNativeProvider,
  imageCandidatesFromHtml,
  srcsetCandidates,
  validateUrl,
} from "@/lib/extraction/native-provider.server";
import type { ProductExtractionResult } from "@/lib/extraction/types";

export { imageCandidatesFromHtml, srcsetCandidates, validateUrl };
export type { ImageCandidate, ProductExtractionResult } from "@/lib/extraction/types";

export async function fetchAndExtract(rawUrl: string): Promise<ProductExtractionResult> {
  const native = await extractWithNativeProvider(rawUrl);
  const reason = fallbackReason(native);

  if (!shouldUseFallback(native)) {
    return mergeExtractionResults(native, null, reason);
  }

  const fallback = await extractWithMicrolinkProvider(native.resolvedUrl ?? rawUrl);
  return mergeExtractionResults(native, fallback, reason);
}
