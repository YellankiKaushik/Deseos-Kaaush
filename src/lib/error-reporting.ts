export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[Wishlist]", { error, context });
}
