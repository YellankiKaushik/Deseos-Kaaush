import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ItemForm, emptyItemForm, type ItemFormValues } from "@/components/item-form";
import { ItemImage } from "@/components/item-image";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { extractProduct } from "@/lib/extract.functions";
import { itemPayload, type ExtractionMeta } from "@/lib/item-payload";
import { missingFieldWarnings } from "@/lib/extraction-ui";
import { removeAllItemImages } from "@/lib/images";
import {
  fetchCategories,
  fetchCollections,
  fetchItem,
  fetchItemCollections,
  fetchPriceHistory,
  numberOrNull,
  requireUserId,
} from "@/lib/queries";
import { formatMoney, priorityLabel, savingsProgress, statusLabel } from "@/lib/aspire";

export const Route = createFileRoute("/_authenticated/items/$id")({
  head: () => ({
    meta: [
      { title: "Item — AspireList" },
      {
        name: "description",
        content: "The full story behind one item on your list: price, plan, and progress.",
      },
      { property: "og:title", content: "Item — AspireList" },
      {
        property: "og:description",
        content: "The full story behind one item on your list: price, plan, and progress.",
      },
    ],
  }),
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const extract = useServerFn(extractProduct);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ItemFormValues>(emptyItemForm);
  const [recheck, setRecheck] = useState<{
    meta: ExtractionMeta;
    changes: { label: string; from: string; to: string; apply: () => void }[];
  } | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [actualPrice, setActualPrice] = useState("");
  const [reflection, setReflection] = useState("");

  const itemQuery = useQuery({ queryKey: ["item", id], queryFn: () => fetchItem(id) });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const collectionsQuery = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const linkedQuery = useQuery({
    queryKey: ["item-collections", id],
    queryFn: () => fetchItemCollections(id),
  });
  const historyQuery = useQuery({
    queryKey: ["price-history", id],
    queryFn: () => fetchPriceHistory(id),
  });

  const item = itemQuery.data;

  useEffect(() => {
    if (!item) return;
    setValues({
      title: item.title,
      source_url: item.source_url ?? "",
      canonical_url: item.canonical_url ?? "",
      store_name: item.store_name ?? "",
      brand: item.brand ?? "",
      description: item.description ?? "",
      current_price: item.current_price != null ? String(item.current_price) : "",
      original_price: item.original_price != null ? String(item.original_price) : "",
      currency: item.currency ?? "INR",
      rating: item.rating != null ? String(item.rating) : "",
      review_count: item.review_count != null ? String(item.review_count) : "",
      availability: item.availability ?? "",
      primary_image_url: item.primary_image_url ?? "",
      image_storage_path: item.image_storage_path ?? null,
      category_id: item.category_id ?? "none",
      priority: item.priority,
      status: item.status,
      reason_for_wanting: item.reason_for_wanting ?? "",
      personal_notes: item.personal_notes ?? "",
      target_purchase_date: item.target_purchase_date ?? "",
      target_budget: item.target_budget != null ? String(item.target_budget) : "",
      amount_saved: item.amount_saved != null ? String(item.amount_saved) : "",
      collectionIds: linkedQuery.data ?? [],
    });
    setActualPrice(
      item.actual_purchase_price != null
        ? String(item.actual_purchase_price)
        : String(item.current_price ?? ""),
    );
    setReflection(item.purchase_reflection ?? "");
  }, [item, linkedQuery.data]);

  const updating = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const price = numberOrNull(values.current_price);
      const { error } = await supabase.from("items").update(itemPayload(values)).eq("id", id);
      if (error) throw error;

      await supabase.from("item_collections").delete().eq("item_id", id);
      if (values.collectionIds.length) {
        await supabase.from("item_collections").insert(
          values.collectionIds.map((collection_id) => ({
            collection_id,
            item_id: id,
            user_id: userId,
          })),
        );
      }

      if (price != null && price !== Number(item?.current_price ?? NaN)) {
        await supabase.from("price_history").insert({
          item_id: id,
          user_id: userId,
          price,
          currency: values.currency,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item-collections", id] });
      queryClient.invalidateQueries({ queryKey: ["price-history", id] });
      setEditing(false);
      toast.success("Saved.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't save changes."),
  });

  /** Re-reads the source page and offers each changed field for review before saving. */
  const rechecking = useMutation({
    mutationFn: async () => {
      const target = item?.canonical_url || item?.source_url;
      if (!target) throw new Error("This item has no link to re-check.");
      return extract({ data: { url: target } });
    },
    onSuccess: (result) => {
      const meta: ExtractionMeta = {
        status: result.status,
        method: result.method,
        confidence: result.confidence,
        error: result.errorMessage ?? null,
        warnings: missingFieldWarnings(result.fieldsFound),
      };
      const changes: { label: string; from: string; to: string; apply: () => void }[] = [];
      const propose = (
        label: string,
        from: string,
        to: string | null | undefined,
        key: keyof ItemFormValues,
      ) => {
        if (to == null || String(to).trim() === "" || String(to) === from) return;
        changes.push({
          label,
          from: from || "—",
          to: String(to),
          apply: () => setValues((prev) => ({ ...prev, [key]: String(to) })),
        });
      };
      propose("Name", values.title, result.title, "title");
      propose(
        "Price",
        values.current_price,
        result.price != null ? String(result.price) : null,
        "current_price",
      );
      propose(
        "Original price",
        values.original_price,
        result.originalPrice != null ? String(result.originalPrice) : null,
        "original_price",
      );
      propose("Availability", values.availability, result.availability, "availability");
      propose("Image", values.primary_image_url, result.imageUrl, "primary_image_url");
      propose("Store", values.store_name, result.storeName, "store_name");

      setRecheck({ meta, changes });
      setEditing(true);
      if (!changes.length) toast.success("Nothing changed on that page.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't re-check that link."),
  });

  const quickAction = useMutation({
    mutationFn: async (patch: TablesUpdate<"items">) => {
      const { error } = await supabase.from("items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "That didn't work."),
  });

  const purchasing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("items")
        .update({
          status: "purchased",
          purchased_at: new Date().toISOString().slice(0, 10),
          actual_purchase_price: numberOrNull(actualPrice),
          purchase_reflection: reflection.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setPurchaseOpen(false);
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Marked as achieved.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't save that."),
  });

  const removing = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      await removeAllItemImages(userId, id).catch(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item removed.");
      navigate({ to: "/dashboard" });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't delete that."),
  });

  if (itemQuery.isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  if (!item) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-2xl">We couldn't find that item</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard">Back to your list</Link>
        </Button>
      </div>
    );
  }

  const { pct, goal, saved, remaining } = savingsProgress(item);

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="bg-surface aspect-4/3 overflow-hidden rounded-2xl border border-border/70">
            <ItemImage
              storagePath={item.image_storage_path}
              remoteUrl={item.primary_image_url}
              alt={item.title}
              className="size-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/12 text-primary border-transparent">
                {priorityLabel(item.priority)}
              </Badge>
              <Badge variant="outline">{statusLabel(item.status)}</Badge>
              {item.is_archived ? <Badge variant="outline">Archived</Badge> : null}
            </div>
            <h1 className="font-display text-3xl leading-tight">{item.title}</h1>
            <p className="text-muted-foreground text-sm">
              {[item.brand, item.store_name || item.source_domain].filter(Boolean).join(" · ") ||
                "Manual entry"}
            </p>
            {item.description ? (
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            ) : null}
          </div>

          {item.reason_for_wanting ? (
            <div className="bg-surface/70 rounded-xl border border-border/70 p-5">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Why I want this
              </p>
              <p className="mt-2 leading-relaxed">{item.reason_for_wanting}</p>
            </div>
          ) : null}

          {item.personal_notes ? (
            <div className="rounded-xl border border-border/70 p-5">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">Notes</p>
              <p className="mt-2 leading-relaxed whitespace-pre-wrap">{item.personal_notes}</p>
            </div>
          ) : null}

          {(historyQuery.data ?? []).length > 1 ? (
            <div className="rounded-xl border border-border/70 p-5">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Price history
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {(historyQuery.data ?? []).map((row) => (
                  <li key={row.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {new Date(row.checked_at).toLocaleDateString()}
                    </span>
                    <span>{formatMoney(Number(row.price), row.currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="bg-card elevated space-y-4 rounded-2xl border border-border/70 p-5">
            <div>
              <p className="text-2xl font-medium">
                {formatMoney(Number(item.current_price), item.currency)}
              </p>
              {item.original_price &&
              Number(item.original_price) > Number(item.current_price ?? 0) ? (
                <p className="text-muted-foreground text-sm line-through">
                  {formatMoney(Number(item.original_price), item.currency)}
                </p>
              ) : null}
            </div>

            {goal > 0 ? (
              <div className="space-y-2">
                <Progress value={pct} className="h-2" />
                <p className="text-muted-foreground text-xs">
                  {formatMoney(saved, item.currency)} saved of {formatMoney(goal, item.currency)} ·{" "}
                  {formatMoney(remaining, item.currency)} to go
                </p>
              </div>
            ) : null}

            {item.target_purchase_date ? (
              <p className="text-muted-foreground text-sm">
                Target date: {new Date(item.target_purchase_date).toLocaleDateString()}
              </p>
            ) : null}

            {item.source_url ? (
              <Button asChild variant="outline" className="w-full">
                <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                  View at store <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : null}

            <div className="grid gap-2">
              <Button onClick={() => setEditing((v) => !v)} variant="secondary">
                {editing ? "Close editor" : "Edit details"}
              </Button>
              {item.canonical_url || item.source_url ? (
                <Button
                  variant="outline"
                  onClick={() => rechecking.mutate()}
                  disabled={rechecking.isPending}
                >
                  {rechecking.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Re-check price
                </Button>
              ) : null}
              {item.status !== "purchased" ? (
                <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
                  <DialogTrigger asChild>
                    <Button>Mark as purchased</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>You got it</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="actualPrice">What did you actually pay?</Label>
                        <Input
                          id="actualPrice"
                          inputMode="decimal"
                          value={actualPrice}
                          onChange={(e) => setActualPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reflection">Was it worth it?</Label>
                        <Textarea
                          id="reflection"
                          rows={3}
                          maxLength={1000}
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                          placeholder="A line for future you."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => purchasing.mutate()} disabled={purchasing.isPending}>
                        Save to achieved
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => quickAction.mutate({ status: "wanted", purchased_at: null })}
                >
                  Move back to the list
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => quickAction.mutate({ is_archived: !item.is_archived })}
              >
                {item.is_archived ? "Unarchive" : "Archive"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes it from your list permanently, along with its notes and price
                      history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removing.mutate()}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </aside>
      </div>

      {recheck && recheck.changes.length ? (
        <div className="bg-surface/70 space-y-4 rounded-2xl border border-border/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg">The store page changed</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Review each change, then save below to keep it.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                recheck.changes.forEach((change) => change.apply());
                setRecheck(null);
              }}
            >
              Accept all
            </Button>
          </div>
          <ul className="space-y-3 text-sm">
            {recheck.changes.map((change) => (
              <li key={change.label} className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="text-muted-foreground">{change.label}: </span>
                  <span className="line-through opacity-60">{change.from}</span> →{" "}
                  <span>{change.to}</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => change.apply()}>
                  Use new
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {editing ? (
        <div className="bg-card elevated rounded-2xl border border-border/70 p-6">
          <ItemForm
            values={values}
            onChange={setValues}
            onSubmit={() => updating.mutate()}
            categories={categoriesQuery.data ?? []}
            collections={collectionsQuery.data ?? []}
            itemId={id}
            submitting={updating.isPending}
            submitLabel="Save changes"
          />
        </div>
      ) : null}
    </div>
  );
}
