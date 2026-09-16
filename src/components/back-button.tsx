import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function fallbackFor(pathname: string) {
  if (pathname === "/items/new") return "/dashboard";
  if (pathname.startsWith("/items/")) return "/dashboard";
  if (pathname.startsWith("/collections/") && pathname !== "/collections") return "/collections";
  if (pathname === "/collections") return "/dashboard";
  if (pathname === "/categories") return "/dashboard";
  if (pathname === "/purchased") return "/dashboard";
  if (pathname === "/archived") return "/dashboard";
  if (pathname === "/settings") return "/dashboard";
  return "/dashboard";
}

export function BackButton() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname === "/dashboard") return null;

  function goBack() {
    if (typeof window !== "undefined" && document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin === window.location.origin && window.history.length > 1) {
          window.history.back();
          return;
        }
      } catch {
        /* fall through to deterministic fallback */
      }
    }
    navigate({ to: fallbackFor(pathname) });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 shrink-0"
      onClick={goBack}
      aria-label="Back"
    >
      <ArrowLeft className="size-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
}
