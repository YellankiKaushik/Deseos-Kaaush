import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Search, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { itemMatchesSearch, sortItems, type SortValue } from "@/lib/wishlist";
import { removeAllItemImages } from "@/lib/images";
import { fetchItems, requireUserId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/archived")({
  head: () => ({
    meta: [
      { title: "Archived — Wishlist" },
      { name: "description", content: "Items you've set aside without deleting them." },
      { property: "og:title", content: "Archived — Wishlist" },
      { property: "og:description", content: "Items you've set aside without deleting them." },
    ],
  }),
  component: Archived,
});

function Archived() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("updated");

  const items = useMemo(
    () =>
      sortItems(
        (data ?? []).filter((item) => item.is_archived && itemMatchesSearch(item, search)),
        sort,
      ),
    [data, search, sort],
  );

  const restoring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").update({ is_archived: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Back on your list.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't restore that."),
  });

  const removing = useMutation({
    mutationFn: async (id: string) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      await removeAllItemImages(userId, id).catch(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Deleted for good.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't delete that."),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Archived</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set aside, but never lost.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search archived items"
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
          <h2 className="font-display text-xl">{search ? "No matches" : "Nothing archived"}</h2>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <ItemCard item={item} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => restoring.mutate(item.id)}>
                  <RotateCcw className="size-4" /> Restore
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/items/$id" params={{ id: item.id }}>
                    View
                  </Link>
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
