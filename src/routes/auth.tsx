import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — WishList" },
      {
        name: "description",
        content: "Sign in to your private WishList and keep planning what's next.",
      },
      { property: "og:title", content: "Sign in — WishList" },
      {
        property: "og:description",
        content: "Sign in to your private WishList and keep planning what's next.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setIsSignUp(false);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in didn't work. Try again.");
      return;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-5">
        <Link to="/" aria-label="WishList home">
          <BrandWordmark className="text-xl" />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-20">
        <div className="bg-card elevated w-full max-w-md rounded-2xl border border-border/70 p-8">
          <h1 className="font-display text-2xl">
            {isSignUp ? "Create your dashboard" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSignUp
              ? "Your list is private to you, from the first item onwards."
              : "Pick up where you left off."}
          </p>

          <Button variant="outline" className="mt-6 w-full" onClick={handleGoogle} disabled={busy}>
            Continue with Google
          </Button>

          <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs uppercase">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp ? (
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  maxLength={80}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={255}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {notice ? <p className="text-sm text-primary">{notice}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Just a moment…" : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground mt-6 w-full text-center text-sm"
            onClick={() => {
              setIsSignUp((v) => !v);
              setNotice(null);
            }}
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </main>
    </div>
  );
}
