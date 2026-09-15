import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllItemCollections, fetchCollections, requireUserId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/collections/")({
  head: () => ({
    meta: [
      { title: "Collections — Wishlist" },
      {
        name: "description",
        content: "Group the things you want into themes, rooms, trips, or seasons.",
      },
      { property: "og:title", content: "Collections — Wishlist" },
      {
        property: "og:description",
        content: "Group the things you want into themes, rooms, trips, or seasons.",
      },
    ],
  }),
  component: Collections,
});

function Collections() {
  const queryClient = useQueryClient();
  const collectionsQuery = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const linksQuery = useQuery({
    queryKey: ["item-collections-all"],
    queryFn: fetchAllItemCollections,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const creating = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const { error } = await supabase.from("collections").insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't create that."),
  });

  const counts = new Map<string, number>();
  for (const link of linksQuery.data ?? []) {
    counts.set(link.collection_id, (counts.get(link.collection_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Collections</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Themes that hold several items together.
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
          creating.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={creating.isPending}>
            Create collection
          </Button>
        </div>
      </form>

      {(collectionsQuery.data ?? []).length === 0 ? (
        <div className="bg-surface/60 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">No collections yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(collectionsQuery.data ?? []).map((collection) => (
            <Link
              key={collection.id}
              to="/collections/$id"
              params={{ id: collection.id }}
              className="bg-card elevated hover:shadow-lifted rounded-xl border border-border/70 p-5 transition-shadow"
            >
              <h2 className="font-display text-lg">{collection.name}</h2>
              {collection.description ? (
                <p className="text-muted-foreground mt-1 text-sm">{collection.description}</p>
              ) : null}
              <p className="text-muted-foreground mt-3 text-xs">
                {counts.get(collection.id) ?? 0} items
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
