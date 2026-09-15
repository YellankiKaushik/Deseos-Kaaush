import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, fetchItems, requireUserId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: "Categories — AspireList" },
      {
        name: "description",
        content: "Rename, add, or remove the categories you sort your list by.",
      },
      { property: "og:title", content: "Categories — AspireList" },
      {
        property: "og:description",
        content: "Rename, add, or remove the categories you sort your list by.",
      },
    ],
  }),
  component: Categories,
});

function Categories() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const itemsQuery = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  const creating = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const { error } = await supabase
        .from("categories")
        .insert({ user_id: userId, name: name.trim(), icon: icon.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setIcon("");
      refresh();
      toast.success("Category added.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't add that category."),
  });

  const renaming = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("categories")
        .update({ name: editingName.trim(), icon: editingIcon.trim() || null })
        .eq("id", editingId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      refresh();
      toast.success("Category renamed.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't rename that."),
  });

  const removing = useMutation({
    mutationFn: async (id: string) => {
      // Items keep existing; they simply lose the category link.
      const { error: clearError } = await supabase
        .from("items")
        .update({ category_id: null })
        .eq("category_id", id);
      if (clearError) throw clearError;
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Category removed.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't remove that."),
  });

  const counts = new Map<string, number>();
  for (const item of itemsQuery.data ?? []) {
    if (item.category_id) counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="text-muted-foreground mt-1 text-sm">The buckets your items sort into.</p>
      </div>

      <form
        className="bg-card elevated grid gap-3 rounded-2xl border border-border/70 p-6 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            toast.error("Give the category a name.");
            return;
          }
          creating.mutate();
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="category-name">New category</Label>
          <Input
            id="category-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-icon">Icon</Label>
          <Input
            id="category-icon"
            value={icon}
            maxLength={40}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="laptop"
          />
        </div>
        <Button type="submit" disabled={creating.isPending}>
          Add
        </Button>
      </form>

      <ul className="divide-y divide-border/70 rounded-2xl border border-border/70">
        {(categoriesQuery.data ?? []).map((category) => (
          <li key={category.id} className="flex items-center gap-3 px-5 py-4">
            {editingId === category.id ? (
              <>
                <Input
                  value={editingName}
                  maxLength={60}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  value={editingIcon}
                  maxLength={40}
                  onChange={(e) => setEditingIcon(e.target.value)}
                  className="w-32"
                  placeholder="icon"
                />
                <Button size="sm" disabled={renaming.isPending} onClick={() => renaming.mutate()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <span className="text-muted-foreground w-20 text-xs">{category.icon ?? "—"}</span>
                <span className="flex-1">{category.name}</span>
                <span className="text-muted-foreground text-xs">
                  {counts.get(category.id) ?? 0} items
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Rename ${category.name}`}
                  onClick={() => {
                    setEditingId(category.id);
                    setEditingName(category.name);
                    setEditingIcon(category.icon ?? "");
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${category.name}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Items in this category stay on your list — they just become uncategorised.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removing.mutate(category.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </li>
        ))}
        {(categoriesQuery.data ?? []).length === 0 ? (
          <li className="text-muted-foreground px-5 py-8 text-center text-sm">
            No categories yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
