import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ItemCard } from "@/components/item-card";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCollection,
  fetchCollectionItemIds,
  fetchItems,
  numberOrNull,
  requireUserId,
} from "@/lib/queries";
import {
  formatMoney,
  itemMatchesSearch,
  sortItems,
  totalsByCurrency,
  type SortValue,
} from "@/lib/wishlist";

export const Route = createFileRoute("/_authenticated/collections/$id")({
  head: () => ({
    meta: [
      { title: "Collection — Wishlist" },
      {
        name: "description",
        content: "One theme, its items, its budget, and how far along it is.",
      },
      { property: "og:title", content: "Collection — Wishlist" },
      {
        property: "og:description",
        content: "One theme, its items, its budget, and how far along it is.",
      },
    ],
  }),
  component: CollectionDetail,
});

function CollectionDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const collectionQuery = useQuery({
    queryKey: ["collection", id],
    queryFn: () => fetchCollection(id),
  });
  const itemsQuery = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const memberQuery = useQuery({
    queryKey: ["collection-items", id],
    queryFn: () => fetchCollectionItemIds(id),
  });

  const collection = collectionQuery.data;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetBudget, setTargetBudget] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("newest");

  useEffect(() => {
    if (!collection) return;
    setName(collection.name);
    setDescription(collection.description ?? "");
    setTargetDate(collection.target_date ?? "");
    setTargetBudget(collection.target_budget != null ? String(collection.target_budget) : "");
  }, [collection]);

  const saving = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("collections")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          target_date: targetDate || null,
          target_budget: numberOrNull(targetBudget),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection saved.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't save that."),
  });

  const toggling = useMutation({
    mutationFn: async ({ itemId, member }: { itemId: string; member: boolean }) => {
      if (member) {
        const { error } = await supabase
          .from("item_collections")
          .delete()
          .eq("collection_id", id)
          .eq("item_id", itemId);
        if (error) throw error;
      } else {
        const userId = await requireUserId();
        const { error } = await supabase
          .from("item_collections")
          .insert({ collection_id: id, item_id: itemId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-items", id] });
      queryClient.invalidateQueries({ queryKey: ["item-collections-all"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't update that."),
  });

  const removing = useMutation({
    mutationFn: async () => {
      await supabase.from("item_collections").delete().eq("collection_id", id);
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted. Your items are untouched.");
      navigate({ to: "/collections" });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't delete that."),
  });

  if (collectionQuery.isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  if (!collection) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-2xl">We couldn't find that collection</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/collections">Back to collections</Link>
        </Button>
      </div>
    );
  }

  const memberIds = new Set(memberQuery.data ?? []);
  const allItems = itemsQuery.data ?? [];
  const items = sortItems(
    allItems.filter((item) => memberIds.has(item.id) && itemMatchesSearch(item, search)),
    sort,
  );
  const totals = totalsByCurrency(items);
  const budget = collection.target_budget != null ? Number(collection.target_budget) : null;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/collections">
          <ArrowLeft className="size-4" /> Collections
        </Link>
      </Button>

      <div>
        <h1 className="font-display text-3xl">{collection.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {items.length} {items.length === 1 ? "item" : "items"}
          {totals.length
            ? ` · ${totals.map((t) => formatMoney(t.amount, t.currency)).join(" + ")}`
            : ""}
          {budget ? ` · budget ${formatMoney(budget, items[0]?.currency ?? "INR")}` : ""}
        </p>
      </div>

      <form
        className="bg-card elevated grid gap-4 rounded-2xl border border-border/70 p-6 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            toast.error("Give the collection a name.");
            return;
          }
          saving.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="collection-name">Name</Label>
          <Input
            id="collection-name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection-description">Description</Label>
          <Textarea
            id="collection-description"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection-date">Target date</Label>
          <Input
            id="collection-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection-budget">Target budget</Label>
          <Input
            id="collection-budget"
            inputMode="decimal"
            value={targetBudget}
            onChange={(e) => setTargetBudget(e.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving.isPending}>
            Save collection
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
                <AlertDialogDescription>
                  The collection disappears, but every item inside it stays on your list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={() => removing.mutate()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this collection"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(value) => setSort(value as SortValue)}>
          <SelectTrigger aria-label="Sort collection">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="target_date">Target date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-surface/60 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Nothing in this collection yet. Tick items below.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border/70 p-6">
        <h2 className="font-display text-lg">Items in this collection</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {allItems.map((item) => {
            const member = memberIds.has(item.id);
            return (
              <label
                key={item.id}
                className="hover:bg-surface flex items-center gap-3 rounded-lg px-2 py-2 text-sm"
              >
                <Checkbox
                  checked={member}
                  onCheckedChange={() => toggling.mutate({ itemId: item.id, member })}
                  aria-label={item.title}
                />
                <span className="line-clamp-1">{item.title}</span>
              </label>
            );
          })}
          {allItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">Add some items first.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
