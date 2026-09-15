import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemCard } from "@/components/item-card";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import {
  itemMatchesSearch,
  sortItems,
  totalsByCurrency,
  formatMoney,
  type SortValue,
} from "@/lib/wishlist";
import { removeAllItemImages } from "@/lib/images";
import { fetchItems, requireUserId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/purchased")({
  head: () => ({
    meta: [
      { title: "Achieved — Wishlist" },
      { name: "description", content: "The archive of everything you set out to get, and got." },
      { property: "og:title", content: "Achieved — Wishlist" },
      {
        property: "og:description",
        content: "The archive of everything you set out to get, and got.",
      },
    ],
  }),
  component: Purchased,
});

function Purchased() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("updated");

  const items = useMemo(
    () =>
      sortItems(
        (data ?? []).filter(
          (item) => item.status === "purchased" && itemMatchesSearch(item, search),
        ),
        sort,
      ),
    [data, search, sort],
  );
  const totals = totalsByCurrency(items);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["items"] });

  const quickAction = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"items"> }) => {
      const { error } = await supabase.from("items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error) => toast.error(error instanceof Error ? error.message : "That didn't work."),
  });

  const removing = useMutation({
    mutationFn: async (id: string) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      await removeAllItemImages(userId, id).catch(() => undefined);
    },
    onSuccess: () => {
      refresh();
      toast.success("Deleted for good.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't delete that."),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Achieved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
          {totals.length
            ? ` · ${totals.map((total) => formatMoney(total.amount, total.currency)).join(" + ")}`
            : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search achieved items"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(value) => setSort(value as SortValue)}>
          <SelectTrigger aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-20 text-center">
          <h2 className="font-display text-xl">{search ? "No matches" : "Nothing achieved yet"}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            When you mark an item as purchased it moves here as a record of what you achieved.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-3">
              <ItemCard item={item} />
              <div className="text-xs text-muted-foreground">
                {item.purchased_at
                  ? `Bought ${new Date(item.purchased_at).toLocaleDateString()}`
                  : "Bought"}
                {item.actual_purchase_price != null
                  ? ` for ${formatMoney(Number(item.actual_purchase_price), item.currency)}`
                  : ""}
              </div>
              {item.purchase_reflection ? (
                <p className="text-sm leading-relaxed italic">"{item.purchase_reflection}"</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    quickAction.mutate({
                      id: item.id,
                      patch: {
                        status: "wanted",
                        purchased_at: null,
                        actual_purchase_price: null,
                        purchase_reflection: null,
                      },
                    })
                  }
                >
                  <RotateCcw className="size-4" /> Move back
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickAction.mutate({ id: item.id, patch: { is_archived: true } })}
                >
                  <Archive className="size-4" /> Archive
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the item permanently, including collection links and price
                        history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removing.mutate(item.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
