import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  listClassName?: string;
};

export function BrandWordmark({ className, listClassName }: BrandWordmarkProps) {
  return (
    <span className={cn("font-display tracking-tight text-foreground", className)}>
      <span>Wish</span>
      <span className={cn("text-brand", listClassName)}>List</span>
    </span>
  );
}
