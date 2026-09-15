import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileJson, ShieldAlert, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount } from "@/lib/account.functions";
import { CURRENCIES, type ViewMode } from "@/lib/aspire";
import {
  backupRowCounts,
  importUserData,
  itemsToCsv,
  parseBackup,
  type BackupFile,
  type ImportMode,
} from "@/lib/backup";
import { exportUserData, fetchProfile, requireUserId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AspireList" },
      { name: "description", content: "Manage your AspireList profile, preferences, and data." },
      { property: "og:title", content: "Settings — AspireList" },
      { property: "og:description", content: "Manage your AspireList profile and data." },
    ],
  }),
  component: Settings,
});

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runDeleteAccount = useServerFn(deleteAccount);
  const fileRef = useRef<HTMLInputElement>(null);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [displayName, setDisplayName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [theme, setTheme] = useState("system");
  const [defaultView, setDefaultView] = useState<ViewMode>("grid");
  const [backup, setBackup] = useState<BackupFile | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [replaceConfirmation, setReplaceConfirmation] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setDefaultCurrency(profile.default_currency);
    setTheme(profile.theme);
    setDefaultView(profile.default_view as ViewMode);
  }, [profileQuery.data]);

  const saving = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          default_currency: defaultCurrency,
          theme,
          default_view: defaultView,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't save."),
  });

  const exporting = useMutation({
    mutationFn: exportUserData,
    onSuccess: (data) => {
      downloadText(
        `aspirelist-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
        "application/json",
      );
      toast.success("Backup downloaded.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Export failed."),
  });

  const exportingCsv = useMutation({
    mutationFn: exportUserData,
    onSuccess: (data) => {
      downloadText(
        `aspirelist-items-${new Date().toISOString().slice(0, 10)}.csv`,
        itemsToCsv(data.data.items as Record<string, unknown>[]),
        "text/csv",
      );
      toast.success("CSV downloaded.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Export failed."),
  });

  const importing = useMutation({
    mutationFn: async () => {
      if (!backup) throw new Error("Choose a backup file first.");
      return importUserData(backup, { mode: importMode, replaceConfirmation });
    },
    onSuccess: (summary) => {
      queryClient.invalidateQueries();
      const restored = summary.reduce((total, row) => total + row.restored, 0);
      const skipped = summary.reduce((total, row) => total + (row.skipped ?? 0), 0);
      toast.success(
        `Import complete: ${restored} restored${skipped ? `, ${skipped} skipped` : ""}.`,
      );
      setBackup(null);
      setReplaceConfirmation("");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Import failed."),
  });

  const deletingData = useMutation({
    mutationFn: async () => {
      if (deleteConfirmation !== "DELETE") throw new Error("Type DELETE to remove your data.");
      const userId = await requireUserId();
      for (const table of [
        "price_history",
        "item_images",
        "item_collections",
        "items",
        "categories",
        "collections",
      ] as const) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from(table) as any).delete().eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setDeleteConfirmation("");
      toast.success("Your AspireList data was deleted.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Deletion failed."),
  });

  const deletingAccount = useMutation({
    mutationFn: () => runDeleteAccount(),
    onSuccess: async () => {
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Account deletion needs a server secret key.",
      ),
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, preferences, and your data.</p>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-6 elevated">
        <h2 className="font-display text-lg">Profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              maxLength={80}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Default currency</Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger>
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
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Default dashboard view</Label>
            <Tabs value={defaultView} onValueChange={(value) => setDefaultView(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <Button className="mt-6" onClick={() => saving.mutate()} disabled={saving.isPending}>
          Save settings
        </Button>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 elevated">
        <h2 className="font-display text-lg">Your data</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => exporting.mutate()} disabled={exporting.isPending}>
            <FileJson className="size-4" /> Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => exportingCsv.mutate()}
            disabled={exportingCsv.isPending}
          >
            <Download className="size-4" /> Export CSV
          </Button>
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Choose backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                setBackup(parseBackup(await file.text()));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Invalid backup.");
              }
            }}
          />
        </div>

        {backup ? (
          <div className="mt-5 space-y-4 rounded-xl border border-border/70 p-4">
            <p className="text-sm">
              Backup from{" "}
              {backup.exportedAt ? new Date(backup.exportedAt).toLocaleString() : "an unknown date"}
              .
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {backupRowCounts(backup).map((row) => (
                <span key={row.table} className="rounded-full border border-border px-3 py-1">
                  {row.table}: {row.count}
                </span>
              ))}
            </div>
            <Tabs value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)}>
              <TabsList>
                <TabsTrigger value="merge">Merge</TabsTrigger>
                <TabsTrigger value="replace">Replace</TabsTrigger>
              </TabsList>
            </Tabs>
            {importMode === "replace" ? (
              <div className="space-y-2">
                <Label htmlFor="replace-confirm">Type REPLACE</Label>
                <Input
                  id="replace-confirm"
                  value={replaceConfirmation}
                  onChange={(event) => setReplaceConfirmation(event.target.value)}
                />
              </div>
            ) : null}
            <Button onClick={() => importing.mutate()} disabled={importing.isPending}>
              Import backup
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 size-5 text-destructive" />
          <div>
            <h2 className="font-display text-lg">Danger zone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These actions affect only the signed-in account's AspireList data.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Label htmlFor="delete-confirm">Type DELETE</Label>
          <Input
            id="delete-confirm"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => deletingData.mutate()}
              disabled={deletingData.isPending}
            >
              Delete app data
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes your auth account through the server and signs you out. It requires
                    `SUPABASE_SECRET_KEY` to be configured on the server.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder="Type DELETE"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteConfirmation !== "DELETE" || deletingAccount.isPending}
                    onClick={() => deletingAccount.mutate()}
                  >
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
