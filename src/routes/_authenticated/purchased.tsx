import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ItemCard } from "@/components/item-card";
import { fetchItems } from "@/lib/queries";
import { formatMoney, totalsByCurrency } from "@/lib/aspire";

export const Route = createFileRoute("/_authenticated/purchased")({
  head: () => ({
    meta: [
      { title: "Achieved — AspireList" },
      { name: "description", content: "The archive of everything you set out to get, and got." },
      { property: "og:title", content: "Achieved — AspireList" },
      {
        property: "og:description",
        content: "The archive of everything you set out to get, and got.",
      },
    ],
  }),
  component: Purchased,
});

function Purchased() {
  const { data } = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const items = (data ?? []).filter((item) => item.status === "purchased");
  const totals = totalsByCurrency(items);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Achieved</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {items.length} {items.length === 1 ? "item" : "items"}
          {totals.length
            ? ` · ${totals.map((t) => formatMoney(t.amount, t.currency)).join(" + ")}`
            : ""}
        </p>
      </div>
      {items.length === 0 ? (
        <div className="bg-surface/60 rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <h2 className="font-display text-xl">Nothing archived yet</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            When you mark an item as purchased it moves here as a record of what you achieved.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <ItemCard item={item} />
              <p className="text-muted-foreground text-xs">
                {item.purchased_at
                  ? `Bought ${new Date(item.purchased_at).toLocaleDateString()}`
                  : "Bought"}
                {item.actual_purchase_price != null
                  ? ` for ${formatMoney(Number(item.actual_purchase_price), item.currency)}`
                  : ""}
              </p>
              {item.purchase_reflection ? (
                <p className="text-sm leading-relaxed italic">“{item.purchase_reflection}”</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
