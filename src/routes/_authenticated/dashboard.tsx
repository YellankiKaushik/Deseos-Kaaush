import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/item-card";
import { fetchCategories, fetchItems } from "@/lib/queries";
import {
  PRIORITIES,
  SORTS,
  STATUSES,
  formatMoney,
  sortItems,
  totalsByCurrency,
  type SortValue,
} from "@/lib/aspire";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AspireList" },
      {
        name: "description",
        content: "Every item you're working towards, in one calm visual board.",
      },
      { property: "og:title", content: "Dashboard — AspireList" },
      {
        property: "og:description",
        content: "Every item you're working towards, in one calm visual board.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const itemsQuery = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortValue>("newest");

  const items = useMemo(() => {
    const all = (itemsQuery.data ?? []).filter(
      (item) => !item.is_archived && item.status !== "purchased",
    );
    const term = search.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (
        term &&
        ![item.title, item.brand, item.store_name, item.description].some((v) =>
          v?.toLowerCase().includes(term),
        )
      )
        return false;
      if (category !== "all" && item.category_id !== category) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
    return sortItems(filtered, sort);
  }, [itemsQuery.data, search, category, priority, status, sort]);

  const totals = totalsByCurrency(items);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Your list</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {items.length} {items.length === 1 ? "item" : "items"}
            {totals.length
              ? ` · ${totals.map((t) => formatMoney(t.amount, t.currency)).join(" + ")}`
              : ""}
          </p>
        </div>
        <Button asChild>
          <Link to="/items/new">
            <Plus className="size-4" /> Add item
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your list"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categoriesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger aria-label="Priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.filter((s) => s.value !== "purchased").map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
          <SelectTrigger aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {itemsQuery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface/60 rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <h2 className="font-display text-xl">Nothing here yet</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            Paste a link to the first thing you're working towards and it becomes a card on this
            board.
          </p>
          <Button asChild className="mt-6">
            <Link to="/items/new">Add your first item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
