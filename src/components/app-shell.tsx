import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  FolderHeart,
  Tags,
  Trophy,
  Archive,
  Settings,
  Plus,
  LogOut,
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/back-button";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { fetchProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/collections", label: "Collections", icon: FolderHeart },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/purchased", label: "Achieved", icon: Trophy },
  { to: "/archived", label: "Archived", icon: Archive },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showBack = pathname !== "/dashboard";
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const theme = profileQuery.data?.theme ?? "system";

  // The saved preference drives the document class so every page follows it.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith(to)
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-surface hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-6">
              <BrandWordmark className="mb-6 block text-xl" />
              {nav}
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" aria-label="WishList dashboard">
            <BrandWordmark className="text-xl" />
          </Link>
          {showBack ? (
            <div className="hidden border-l border-border/70 pl-3 md:block">
              <BackButton />
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/items/new">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add item</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-24">{nav}</div>
        </aside>
        <main className="min-w-0 flex-1">
          {showBack ? (
            <div className="mb-4 md:hidden">
              <BackButton />
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
