import { ExternalLink } from "lucide-react";
import { ItemImage } from "@/components/item-image";
import { Badge } from "@/components/ui/badge";
import type { ItemFormValues } from "@/components/item-form";
import { domainOf, formatMoney } from "@/lib/wishlist";

type Props = {
  values: ItemFormValues;
};

export function ProductPreview({ values }: Props) {
  const price = values.current_price ? Number(values.current_price) : null;
  const store = [values.brand, values.store_name].filter(Boolean).join(" · ");
  const sourceDomain = domainOf(values.canonical_url || values.source_url);

  if (
    !values.title &&
    !values.primary_image_url &&
    !values.store_name &&
    !values.current_price &&
    !sourceDomain
  ) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border/70 bg-surface/60 p-3">
      <div className="grid gap-3 sm:grid-cols-[112px_1fr] sm:items-center">
        <div className="bg-surface aspect-square overflow-hidden rounded-lg border border-border/70">
          <ItemImage
            remoteUrl={values.primary_image_url}
            alt={values.title || "Product preview"}
            className="size-full object-cover"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {values.availability ? <Badge variant="outline">{values.availability}</Badge> : null}
            {values.source_url ? <ExternalLink className="size-3.5 text-muted-foreground" /> : null}
          </div>
          <div>
            <h2 className="font-display line-clamp-2 text-xl leading-tight">
              {values.title || "Product preview"}
            </h2>
            {store ? <p className="mt-1 text-sm text-muted-foreground">{store}</p> : null}
          </div>
          {price != null && Number.isFinite(price) ? (
            <p className="text-lg font-medium">{formatMoney(price, values.currency)}</p>
          ) : null}
          {sourceDomain ? <p className="text-xs text-muted-foreground">{sourceDomain}</p> : null}
        </div>
      </div>
    </section>
  );
}
