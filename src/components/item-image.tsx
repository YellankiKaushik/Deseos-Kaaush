import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { signedImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export function useSignedImage(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-image", path],
    queryFn: () => signedImageUrl(path as string),
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
  });
}

type Props = {
  storagePath?: string | null;
  remoteUrl?: string | null;
  alt: string;
  className?: string;
};

/** Shows a stored image (signed URL) when present, otherwise the remote URL, with a graceful fallback. */
export function ItemImage({ storagePath, remoteUrl, alt, className }: Props) {
  const signed = useSignedImage(storagePath);
  const [broken, setBroken] = useState(false);
  const src = storagePath ? signed.data : remoteUrl || null;

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken || (storagePath && signed.isError)) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex size-full items-center justify-center",
          className,
        )}
      >
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}
