import { Link } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ItemImage } from "@/components/item-image";

import { formatMoney, priorityLabel, savingsProgress, statusLabel, type Item } from "@/lib/aspire";
import { cn } from "@/lib/utils";

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-transparent",
        priority === "dream" && "bg-primary/15 text-primary",
        priority === "high" && "bg-primary/10 text-primary",
      )}
    >
      {priorityLabel(priority)}
    </Badge>
  );
}

export function ItemCard({ item }: { item: Item }) {
  const { pct, goal } = savingsProgress(item);

  return (
    <Link
      to="/items/$id"
      params={{ id: item.id }}
      className="group bg-card elevated flex flex-col overflow-hidden rounded-xl border border-border/70 transition-shadow hover:shadow-lifted"
    >
      <div className="bg-surface relative aspect-4/3 overflow-hidden">
        <ItemImage
          storagePath={item.image_storage_path}
          remoteUrl={item.primary_image_url}
          alt={item.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute top-3 left-3 flex gap-2">
          <PriorityBadge priority={item.priority} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {item.store_name || item.source_domain || "Manual entry"}
          </p>
          <h3 className="font-display line-clamp-2 text-base leading-snug">{item.title}</h3>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-medium">
              {formatMoney(Number(item.current_price), item.currency)}
            </span>
            {item.rating ? (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Star className="size-3 fill-current" />
                {Number(item.rating).toFixed(1)}
              </span>
            ) : null}
          </div>

          {goal > 0 && Number(item.amount_saved) > 0 ? (
            <div className="space-y-1">
              <Progress value={pct} className="h-1.5" />
              <p className="text-muted-foreground text-xs">{pct}% saved</p>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-normal">
              {statusLabel(item.status)}
            </Badge>
            {item.source_url ? <ExternalLink className="text-muted-foreground size-3.5" /> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
