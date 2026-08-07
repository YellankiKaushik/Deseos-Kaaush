import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchItems } from "@/lib/queries";
import { removeAllItemImages } from "@/lib/images";
import { requireUserId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/archived")({
  head: () => ({
    meta: [
      { title: "Archived — AspireList" },
      { name: "description", content: "Items you've set aside without deleting them." },
      { property: "og:title", content: "Archived — AspireList" },
      { property: "og:description", content: "Items you've set aside without deleting them." },
    ],
  }),
  component: Archived,
});

function Archived() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const items = (data ?? []).filter((item) => item.is_archived);

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
        <p className="text-muted-foreground mt-1 text-sm">Set aside, but never lost.</p>
      </div>
      {items.length === 0 ? (
        <div className="bg-surface/60 rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <h2 className="font-display text-xl">Nothing archived</h2>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <ItemCard item={item} />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => restoring.mutate(item.id)}>
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removing.mutate(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
