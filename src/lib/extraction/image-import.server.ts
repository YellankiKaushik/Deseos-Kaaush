import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { validateUrl } from "@/lib/extraction/extract.server";

const IMAGE_BUCKET = "item-images";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_IMPORT_TIMEOUT_MS = 12_000;
const IMAGE_IMPORT_MAX_REDIRECTS = 5;

export class RemoteImageImportError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RemoteImageImportError";
  }
}

type FetchRemoteImageOptions = {
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  referrerUrl?: string | null;
};

type FetchedRemoteImage = {
  blob: Blob;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  resolvedUrl: string;
};

function imageExtension(contentType: FetchedRemoteImage["contentType"]) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function contentTypeOf(response: Response) {
  return response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function redirectTarget(current: URL, response: Response) {
  const location = response.headers.get("location");
  if (!location) return null;
  return new URL(location, current);
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

async function readLimitedBytes(response: Response, maxBytes: number) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RemoteImageImportError(
      "image_too_large",
      "The extracted image is larger than the storage limit.",
    );
  }

  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new RemoteImageImportError(
        "image_too_large",
        "The extracted image is larger than the storage limit.",
      );
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalSize += value.byteLength;
    if (totalSize > maxBytes) {
      await reader.cancel();
      throw new RemoteImageImportError(
        "image_too_large",
        "The extracted image is larger than the storage limit.",
      );
    }
    chunks.push(value);
  }

  return concatChunks(chunks, totalSize);
}

export function imageImportWarning(error: unknown) {
  if (error instanceof RemoteImageImportError) return error.message;
  if (error instanceof Error && error.name === "AbortError") {
    return "The extracted image took too long to import, so the original image link was kept.";
  }
  if (error instanceof Error) return `Image import failed: ${error.message}`;
  return "Image import failed, so the original image link was kept.";
}

export function imageImportFallbackResult(
  imageUrl: string,
  existingWarnings: string[] | null | undefined,
  error: unknown,
) {
  return {
    ok: false as const,
    storagePath: null,
    sourceUrl: imageUrl,
    warnings: [...new Set([...(existingWarnings ?? []), imageImportWarning(error)])],
  };
}

export function shouldImportRemoteImage(
  storagePath: string | null | undefined,
  remoteUrl: string | null | undefined,
) {
  return Boolean(remoteUrl && !storagePath);
}

export async function fetchRemoteImage(
  rawUrl: string,
  {
    fetchImpl = fetch,
    maxBytes = IMAGE_IMPORT_MAX_BYTES,
    timeoutMs = IMAGE_IMPORT_TIMEOUT_MS,
    maxRedirects = IMAGE_IMPORT_MAX_REDIRECTS,
    referrerUrl = null,
  }: FetchRemoteImageOptions = {},
): Promise<FetchedRemoteImage> {
  const checked = validateUrl(rawUrl);
  if (!checked.ok) {
    throw new RemoteImageImportError(checked.code, checked.message);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let current = checked.url;
  let response: Response | null = null;
  const checkedReferrer = referrerUrl ? validateUrl(referrerUrl) : null;
  const referer =
    checkedReferrer && checkedReferrer.ok ? checkedReferrer.url.toString() : checked.url.origin;

  try {
    for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
      response = await fetchImpl(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
          Referer: referer,
        },
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      if (redirect === maxRedirects) {
        throw new RemoteImageImportError(
          "too_many_redirects",
          "The extracted image redirects too many times.",
        );
      }
      const target = redirectTarget(current, response);
      if (!target) break;
      const targetCheck = validateUrl(target.toString());
      if (!targetCheck.ok) {
        throw new RemoteImageImportError(targetCheck.code, targetCheck.message);
      }
      current = targetCheck.url;
    }

    if (!response) {
      throw new RemoteImageImportError(
        "network_error",
        "The extracted image could not be fetched.",
      );
    }
    if (!response.ok) {
      throw new RemoteImageImportError(
        `http_${response.status}`,
        "The extracted image could not be imported.",
      );
    }

    const contentType = contentTypeOf(response);
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new RemoteImageImportError(
        "unsupported_image_type",
        "The extracted image is not a JPEG, PNG, or WebP file.",
      );
    }

    const bytes = await readLimitedBytes(response, maxBytes);
    const typedContentType = contentType as FetchedRemoteImage["contentType"];
    return {
      blob: new Blob([bytes], { type: typedContentType }),
      contentType: typedContentType,
      extension: imageExtension(typedContentType),
      resolvedUrl: response.url || current.toString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function importRemoteImageForItem({
  supabase,
  userId,
  itemId,
  imageUrl,
  imageUrls,
  referrerUrl,
  altText,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  itemId: string;
  imageUrl: string;
  imageUrls?: string[];
  referrerUrl?: string | null;
  altText: string;
}) {
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id,title,image_storage_path")
    .eq("id", itemId)
    .single();
  if (itemError || !item) {
    throw new RemoteImageImportError("item_not_found", "That item could not be found.");
  }

  const candidates = [...new Set([imageUrl, ...(imageUrls ?? [])].filter(Boolean))].slice(0, 5);
  let image: FetchedRemoteImage | null = null;
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      image = await fetchRemoteImage(candidate, { referrerUrl: referrerUrl ?? null });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!image) {
    throw (
      lastError ??
      new RemoteImageImportError("image_import_failed", "No extracted image could be imported.")
    );
  }
  const path = `${userId}/${itemId}/remote-${Date.now()}-${crypto.randomUUID()}.${image.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, image.blob, {
      contentType: image.contentType,
      upsert: false,
    });
  if (uploadError) {
    throw new RemoteImageImportError("storage_upload_failed", uploadError.message);
  }

  const previousPath = item.image_storage_path;
  if (previousPath?.startsWith(`${userId}/${itemId}/remote-`)) {
    await supabase.storage.from(IMAGE_BUCKET).remove([previousPath]);
  }

  const { error: updateError } = await supabase
    .from("items")
    .update({
      image_storage_path: path,
      primary_image_url: image.resolvedUrl,
    })
    .eq("id", itemId);
  if (updateError) throw new RemoteImageImportError("item_update_failed", updateError.message);

  const { error: deleteError } = await supabase.from("item_images").delete().eq("item_id", itemId);
  if (deleteError) throw new RemoteImageImportError("image_metadata_failed", deleteError.message);

  const { error: insertError } = await supabase.from("item_images").insert({
    item_id: itemId,
    user_id: userId,
    storage_path: path,
    source_url: image.resolvedUrl,
    alt_text: altText || item.title,
    position: 0,
  });
  if (insertError) throw new RemoteImageImportError("image_metadata_failed", insertError.message);

  return {
    storagePath: path,
    sourceUrl: image.resolvedUrl,
  };
}
