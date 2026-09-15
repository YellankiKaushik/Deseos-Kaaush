import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Grid2X2, List, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  fetchAllItemCollections,
  fetchCategories,
  fetchCollections,
  fetchItems,
  fetchProfile,
} from "@/lib/queries";
import {
  CURRENCIES,
  PRIORITIES,
  SORTS,
  STATUSES,
  formatMoney,
  itemMatchesSearch,
  sortItems,
  totalsByCurrency,
  type Item,
  type SortValue,
  type ViewMode,
} from "@/lib/wishlist";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Wishlist" },
      {
        name: "description",
        content: "Every item you're working towards, in one calm visual board.",
      },
      { property: "og:title", content: "Dashboard — Wishlist" },
      {
        property: "og:description",
        content: "Every item you're working towards, in one calm visual board.",
      },
    ],
  }),
  component: Dashboard,
});

const PAGE_SIZE = 24;

function ItemRow({ item }: { item: Item }) {
  return (
    <Link
      to="/items/$id"
      params={{ id: item.id }}
      className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-surface sm:grid-cols-[minmax(0,1fr)_auto_auto]"
    >
      <div className="min-w-0">
        <p className="line-clamp-1 font-display text-base">{item.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[item.brand, item.store_name || item.source_domain].filter(Boolean).join(" · ") ||
            "Manual entry"}
        </p>
      </div>
      <div className="text-sm font-medium">
        {formatMoney(Number(item.current_price), item.currency)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{item.status.replaceAll("_", " ")}</Badge>
        <Badge variant="secondary">{item.priority}</Badge>
      </div>
    </Link>
  );
}

function Dashboard() {
  const itemsQuery = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const collectionsQuery = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const linksQuery = useQuery({
    queryKey: ["item-collections-all"],
    queryFn: fetchAllItemCollections,
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [collection, setCollection] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [store, setStore] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [sort, setSort] = useState<SortValue>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (profileQuery.data?.default_view) setView(profileQuery.data.default_view as ViewMode);
  }, [profileQuery.data?.default_view]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category, collection, priority, status, store, currency, sort]);

  const collectionItemIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const link of linksQuery.data ?? []) {
      const set = map.get(link.collection_id) ?? new Set<string>();
      set.add(link.item_id);
      map.set(link.collection_id, set);
    }
    return map;
  }, [linksQuery.data]);

  const allActive = (itemsQuery.data ?? []).filter(
    (item) => !item.is_archived && item.status !== "purchased",
  );

  const stores = [
    ...new Set(
      allActive
        .map((item) => item.store_name || item.source_domain)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const currencies = [
    ...new Set(
      allActive.map((item) => item.currency).filter((value): value is string => Boolean(value)),
    ),
  ].sort();

  const items = useMemo(() => {
    const collectionMembers = collection !== "all" ? collectionItemIds.get(collection) : null;
    const filtered = allActive.filter((item) => {
      if (!itemMatchesSearch(item, search)) return false;
      if (category === "uncategorized" && item.category_id) return false;
      if (category !== "all" && category !== "uncategorized" && item.category_id !== category) {
        return false;
      }
      if (collectionMembers && !collectionMembers.has(item.id)) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (status !== "all" && item.status !== status) return false;
      if (store !== "all" && (item.store_name || item.source_domain) !== store) return false;
      if (currency !== "all" && item.currency !== currency) return false;
      return true;
    });
    return sortItems(filtered, sort);
  }, [
    allActive,
    category,
    collection,
    collectionItemIds,
    currency,
    priority,
    search,
    sort,
    status,
    store,
  ]);

  const totals = totalsByCurrency(items);
  const shown = items.slice(0, visibleCount);
  const activeFilters = [
    search.trim() ? { label: `Search: ${search.trim()}`, clear: () => setSearch("") } : null,
    category !== "all" ? { label: "Category", clear: () => setCategory("all") } : null,
    collection !== "all" ? { label: "Collection", clear: () => setCollection("all") } : null,
    priority !== "all" ? { label: "Priority", clear: () => setPriority("all") } : null,
    status !== "all" ? { label: "Status", clear: () => setStatus("all") } : null,
    store !== "all" ? { label: "Store", clear: () => setStore("all") } : null,
    currency !== "all" ? { label: "Currency", clear: () => setCurrency("all") } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setCollection("all");
    setPriority("all");
    setStatus("all");
    setStore("all");
    setCurrency("all");
  };

  const loading = itemsQuery.isLoading || categoriesQuery.isLoading || collectionsQuery.isLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Your list</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
            {totals.length
              ? ` · ${totals.map((total) => formatMoney(total.amount, total.currency)).join(" + ")}`
              : ""}
          </p>
        </div>
        <Button asChild>
          <Link to="/items/new">
            <Plus className="size-4" /> Add item
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <div className="relative sm:col-span-2 xl:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {(categoriesQuery.data ?? []).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={collection} onValueChange={setCollection}>
          <SelectTrigger aria-label="Collection">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All collections</SelectItem>
            {(collectionsQuery.data ?? []).map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
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
        <Select value={sort} onValueChange={(value) => setSort(value as SortValue)}>
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
        <Select value={store} onValueChange={setStore}>
          <SelectTrigger aria-label="Store">
            <SelectValue placeholder="Store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stores</SelectItem>
            {stores.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger aria-label="Currency">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All currencies</SelectItem>
            {[...new Set([...currencies, ...CURRENCIES])].map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant={view === "grid" ? "secondary" : "outline"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <Grid2X2 className="size-4" />
          </Button>
          <Button
            size="icon"
            variant={view === "list" ? "secondary" : "outline"}
            aria-label="List view"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {activeFilters.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.label}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={filter.clear}
            >
              {filter.label} <X className="size-3" />
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : allActive.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-20 text-center">
          <h2 className="font-display text-xl">Nothing here yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Paste a link to the first thing you're working towards and it becomes a card on this
            board.
          </p>
          <Button asChild className="mt-6">
            <Link to="/items/new">Add your first item</Link>
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-20 text-center">
          <h2 className="font-display text-xl">No matches</h2>
          <Button variant="outline" className="mt-6" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {shown.length < items.length ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
