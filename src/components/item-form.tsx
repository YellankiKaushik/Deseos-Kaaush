import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageField } from "@/components/image-field";
import { CURRENCIES, PRIORITIES, STATUSES, type Category, type Collection } from "@/lib/aspire";

export type ItemFormValues = {
  title: string;
  source_url: string;
  canonical_url: string;
  store_name: string;
  brand: string;
  description: string;
  current_price: string;
  original_price: string;
  currency: string;
  rating: string;
  review_count: string;
  availability: string;
  primary_image_url: string;
  image_storage_path: string | null;
  category_id: string;
  priority: string;
  status: string;
  reason_for_wanting: string;
  personal_notes: string;
  target_purchase_date: string;
  target_budget: string;
  amount_saved: string;
  collectionIds: string[];
};

export const emptyItemForm: ItemFormValues = {
  title: "",
  source_url: "",
  canonical_url: "",
  store_name: "",
  brand: "",
  description: "",
  current_price: "",
  original_price: "",
  currency: "INR",
  rating: "",
  review_count: "",
  availability: "",
  primary_image_url: "",
  image_storage_path: null,
  category_id: "none",
  priority: "medium",
  status: "considering",
  reason_for_wanting: "",
  personal_notes: "",
  target_purchase_date: "",
  target_budget: "",
  amount_saved: "",
  collectionIds: [],
};

type Props = {
  values: ItemFormValues;
  onChange: (values: ItemFormValues) => void;
  onSubmit: () => void;
  categories: Category[];
  collections: Collection[];
  itemId: string;
  submitting?: boolean;
  submitLabel?: string;
  secondaryAction?: React.ReactNode;
};

export function ItemForm({
  values,
  onChange,
  onSubmit,
  categories,
  collections,
  itemId,
  submitting,
  submitLabel = "Save item",
  secondaryAction,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) =>
    onChange({ ...values, [key]: value });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.title.trim()) {
      setError("Give this item a name so you can find it later.");
      return;
    }
    setError(null);
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-display text-lg">The item</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              value={values.title}
              maxLength={220}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What is it?"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source_url">Link</Label>
            <Input
              id="source_url"
              value={values.source_url}
              onChange={(e) => set("source_url", e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="canonical_url">Canonical link</Label>
            <Input
              id="canonical_url"
              value={values.canonical_url}
              onChange={(e) => set("canonical_url", e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_name">Store</Label>
            <Input
              id="store_name"
              value={values.store_name}
              onChange={(e) => set("store_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" value={values.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <ImageField
            itemId={itemId}
            storagePath={values.image_storage_path}
            remoteUrl={values.primary_image_url}
            onStoragePathChange={(path) => set("image_storage_path", path)}
            onRemoteUrlChange={(url) => set("primary_image_url", url)}
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              maxLength={2000}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg">Price</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current_price">Current price</Label>
            <Input
              id="current_price"
              inputMode="decimal"
              value={values.current_price}
              onChange={(e) => set("current_price", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="original_price">Original price</Label>
            <Input
              id="original_price"
              inputMode="decimal"
              value={values.original_price}
              onChange={(e) => set("original_price", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={values.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              inputMode="decimal"
              value={values.rating}
              onChange={(e) => set("rating", e.target.value)}
              placeholder="4.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review_count">Reviews</Label>
            <Input
              id="review_count"
              inputMode="numeric"
              value={values.review_count}
              onChange={(e) => set("review_count", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              value={values.availability}
              onChange={(e) => set("availability", e.target.value)}
              placeholder="In stock"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg">Why and when</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={values.category_id} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={values.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={values.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_purchase_date">Target date</Label>
            <Input
              id="target_purchase_date"
              type="date"
              value={values.target_purchase_date}
              onChange={(e) => set("target_purchase_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_budget">Target budget</Label>
            <Input
              id="target_budget"
              inputMode="decimal"
              value={values.target_budget}
              onChange={(e) => set("target_budget", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount_saved">Saved so far</Label>
            <Input
              id="amount_saved"
              inputMode="decimal"
              value={values.amount_saved}
              onChange={(e) => set("amount_saved", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reason_for_wanting">Why it matters</Label>
            <Textarea
              id="reason_for_wanting"
              rows={3}
              maxLength={1000}
              value={values.reason_for_wanting}
              onChange={(e) => set("reason_for_wanting", e.target.value)}
              placeholder="The reason this belongs on your list."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="personal_notes">Notes</Label>
            <Textarea
              id="personal_notes"
              rows={3}
              maxLength={2000}
              value={values.personal_notes}
              onChange={(e) => set("personal_notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      {collections.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg">Collections</h2>
          <div className="flex flex-wrap gap-3">
            {collections.map((collection) => {
              const checked = values.collectionIds.includes(collection.id);
              return (
                <label
                  key={collection.id}
                  className="bg-card flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) =>
                      set(
                        "collectionIds",
                        next
                          ? [...values.collectionIds, collection.id]
                          : values.collectionIds.filter((id) => id !== collection.id),
                      )
                    }
                  />
                  {collection.name}
                </label>
              );
            })}
          </div>
        </section>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  );
}
