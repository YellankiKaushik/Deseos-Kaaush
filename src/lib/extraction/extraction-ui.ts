import { EXTRACTION_FIELDS } from "@/lib/extraction/fields";

/** Human-readable list of fields the extractor could not find. */
export function missingFieldWarnings(
  fieldsFound: Record<string, boolean> | null | undefined,
): string[] {
  if (!fieldsFound) return [];
  return EXTRACTION_FIELDS.filter(({ key }) => !fieldsFound[key]).map(({ label }) => label);
}
