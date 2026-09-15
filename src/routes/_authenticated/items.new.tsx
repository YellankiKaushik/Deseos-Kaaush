import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemForm, emptyItemForm, type ItemFormValues } from "@/components/item-form";
import { extractProduct } from "@/lib/extract.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCategories,
  fetchCollections,
  findDuplicateItems,
  numberOrNull,
  requireUserId,
} from "@/lib/queries";
import { normalizeUrl } from "@/lib/aspire";
import { itemPayload, type ExtractionMeta } from "@/lib/item-payload";
import { missingFieldWarnings } from "@/lib/extraction-ui";
import { syncItemImageMetadata } from "@/lib/images";

export const Route = createFileRoute("/_authenticated/items/new")({
  head: () => ({
    meta: [
      { title: "Add an item — AspireList" },
      {
        name: "description",
        content: "Paste a link or enter details by hand to add something to your list.",
      },
      { property: "og:title", content: "Add an item — AspireList" },
      {
        property: "og:description",
        content: "Paste a link or enter details by hand to add something to your list.",
      },
    ],
  }),
  component: NewItem,
});

function NewItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const extract = useServerFn(extractProduct);
  const [itemId] = useState(() => crypto.randomUUID());

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const collectionsQuery = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  const [url, setUrl] = useState("");
  const [values, setValues] = useState<ItemFormValues>(emptyItemForm);
  const [showForm, setShowForm] = useState(false);
  const [extractionMeta, setExtractionMeta] = useState<ExtractionMeta | null>(null);

  const normalized = useMemo(
    () => normalizeUrl(values.canonical_url || values.source_url || url) ?? "",
    [values.canonical_url, values.source_url, url],
  );
  const duplicatesQuery = useQuery({
    queryKey: ["duplicates", normalized],
    queryFn: () => findDuplicateItems(normalized),
    enabled: normalized.length > 0,
  });
  const duplicate = duplicatesQuery.data?.[0];

  const extracting = useMutation({
    mutationFn: (target: string) => extract({ data: { url: target } }),
    onSuccess: (result) => {
      setExtractionMeta({
        status: result.status,
        method: result.method,
        confidence: result.confidence,
        error: result.errorMessage ?? null,
        warnings: missingFieldWarnings(result.fieldsFound),
      });
      setValues((prev) => ({
        ...prev,
        title: result.title ?? prev.title,
        source_url: result.resolvedUrl ?? url,
        canonical_url: result.canonicalUrl ?? prev.canonical_url,
        store_name: result.storeName ?? prev.store_name,
        brand: result.brand ?? prev.brand,
        description: result.description ?? prev.description,
        current_price: result.price != null ? String(result.price) : prev.current_price,
        original_price:
          result.originalPrice != null ? String(result.originalPrice) : prev.original_price,
        currency: result.currency ?? prev.currency,
        rating: result.rating != null ? String(result.rating) : prev.rating,
        review_count: result.reviewCount != null ? String(result.reviewCount) : prev.review_count,
        availability: result.availability ?? prev.availability,
        primary_image_url: result.imageUrl ?? prev.primary_image_url,
      }));
      setShowForm(true);
      if (result.status === "failed") {
        toast.info(
          "That site didn't share its details. Fill them in below and it'll look just as good.",
        );
      } else if (result.status === "partial") {
        toast.info("Got some details. Check anything that looks off.");
      } else {
        toast.success("Details pulled in. Have a quick look before saving.");
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Extraction failed";
      setExtractionMeta({
        status: "failed",
        method: "none",
        confidence: 0,
        error: message,
        warnings: [],
      });
      setValues((prev) => ({ ...prev, source_url: url }));
      setShowForm(true);
      toast.info("We couldn't read that page. Add the details by hand below.");
    },
  });

  const saving = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const payload = itemPayload(values, extractionMeta);
      const { data, error } = await supabase
        .from("items")
        .insert({ id: itemId, user_id: userId, ...payload })
        .select("id")
        .single();
      if (error) throw error;

      await syncItemImageMetadata({
        userId,
        itemId: data.id,
        storagePath: payload.image_storage_path ?? null,
        sourceUrl: payload.primary_image_url ?? null,
        altText: payload.title,
      });

      if (values.collectionIds.length) {
        const { error: linkError } = await supabase.from("item_collections").insert(
          values.collectionIds.map((collection_id) => ({
            collection_id,
            item_id: data.id,
            user_id: userId,
          })),
        );
        if (linkError) throw linkError;
      }

      const price = numberOrNull(values.current_price);
      if (price != null) {
        await supabase.from("price_history").insert({
          item_id: data.id,
          user_id: userId,
          price,
          currency: values.currency,
        });
      }

      return data.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Added to your list.");
      navigate({ to: "/items/$id", params: { id } });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't save that item."),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Add an item</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Start with a link, or skip straight to filling it in yourself.
        </p>
      </div>

      <div className="bg-card elevated space-y-4 rounded-2xl border border-border/70 p-6">
        <div className="space-y-2">
          <Label htmlFor="url">Product link</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://store.com/the-thing"
            />
            <Button
              onClick={() => {
                if (!url.trim()) {
                  toast.error("Paste a link first.");
                  return;
                }
                extracting.mutate(url.trim());
              }}
              disabled={extracting.isPending}
            >
              {extracting.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {extracting.isPending ? "Reading page…" : "Fetch details"}
            </Button>
          </div>
        </div>

        {duplicate ? (
          <p className="text-sm">
            You already saved this link as{" "}
            <Link
              to="/items/$id"
              params={{ id: duplicate.id }}
              className="text-primary underline underline-offset-4"
            >
              {duplicate.title}
            </Link>
            .
          </p>
        ) : null}

        {!showForm ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
            onClick={() => setShowForm(true)}
          >
            Or add it manually
          </button>
        ) : null}

        {extractionMeta ? (
          <div className="text-muted-foreground space-y-1 text-xs">
            <p>
              Extraction: {extractionMeta.status} via {extractionMeta.method}
              {extractionMeta.confidence != null
                ? ` · ${Math.round(extractionMeta.confidence * 100)}% confidence`
                : ""}
              {extractionMeta.error ? ` — ${extractionMeta.error}` : ""}
            </p>
            {extractionMeta.warnings.length ? (
              <p>Not found: {extractionMeta.warnings.join(", ")}. Add them below if you like.</p>
            ) : null}
            {extractionMeta.status !== "success" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0"
                disabled={extracting.isPending}
                onClick={() => url.trim() && extracting.mutate(url.trim())}
              >
                Retry extraction
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showForm ? (
        <div className="bg-card elevated rounded-2xl border border-border/70 p-6">
          <ItemForm
            values={values}
            onChange={setValues}
            onSubmit={() => saving.mutate()}
            categories={categoriesQuery.data ?? []}
            collections={collectionsQuery.data ?? []}
            itemId={itemId}
            submitting={saving.isPending}
            submitLabel="Add to my list"
          />
        </div>
      ) : null}
    </div>
  );
}
