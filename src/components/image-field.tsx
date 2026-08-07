import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemImage } from "@/components/item-image";
import { removeItemImage, uploadItemImage, validateImageFile } from "@/lib/images";
import { requireUserId } from "@/lib/queries";

type Props = {
  itemId: string;
  storagePath: string | null;
  remoteUrl: string;
  onStoragePathChange: (path: string | null) => void;
  onRemoteUrlChange: (url: string) => void;
};

export function ImageField({
  itemId,
  storagePath,
  remoteUrl,
  onStoragePathChange,
  onRemoteUrlChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const userId = await requireUserId();
      const previous = storagePath;
      const path = await uploadItemImage(userId, itemId, file);
      onStoragePathChange(path);
      if (previous) await removeItemImage(previous).catch(() => undefined);
      toast.success("Image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <Label>Image</Label>
      <div className="bg-surface aspect-4/3 max-h-64 overflow-hidden rounded-lg border border-border">
        <ItemImage storagePath={storagePath} remoteUrl={remoteUrl} alt="Item preview" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {storagePath ? "Replace image" : "Upload image"}
        </Button>
        {storagePath ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await removeItemImage(storagePath);
                onStoragePathChange(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete that image.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Trash2 className="size-4" /> Remove
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="primary_image_url">Or use an image link</Label>
        <Input
          id="primary_image_url"
          value={remoteUrl}
          onChange={(e) => onRemoteUrlChange(e.target.value)}
          placeholder="https://"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        JPEG, PNG, or WebP up to 10 MB. Uploads are resized to 1600px and kept private to your
        account.
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
