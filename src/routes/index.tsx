import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowRight,
  Download,
  FolderHeart,
  History,
  Link2,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wishlist — Save what you want, plan when to buy it" },
      {
        name: "description",
        content:
          "Paste product links, organize what you want, track savings, and keep a private record of purchases.",
      },
      {
        property: "og:title",
        content: "Wishlist — Save what you want, plan when to buy it",
      },
      {
        property: "og:description",
        content:
          "A private cross-store wishlist and purchase planning app for products you want to revisit when you're ready to buy.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Link2,
    title: "Paste a link",
    body: "Add a product URL from almost any store and let Wishlist collect the useful details it can read.",
  },
  {
    icon: ShieldCheck,
    title: "Review the product",
    body: "Edit the title, price, image, category, notes, and reason so the saved item stays accurate.",
  },
  {
    icon: PiggyBank,
    title: "Plan and buy",
    body: "Set a budget, track savings, mark purchases, and keep achieved items in your private history.",
  },
] as const;

const features = [
  { icon: Link2, label: "Products from different stores" },
  { icon: FolderHeart, label: "Collections for bigger plans" },
  { icon: Tags, label: "Categories for everyday sorting" },
  { icon: History, label: "Price information and history" },
  { icon: PiggyBank, label: "Savings goals and progress" },
  { icon: Archive, label: "Purchased and achieved items" },
  { icon: LockKeyhole, label: "Private authenticated accounts" },
  { icon: Download, label: "JSON and CSV data export" },
] as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="font-display text-xl">
          Wishlist
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#privacy" className="hover:text-foreground">
            Privacy
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your wishlist
            </Link>
          </Button>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-8 pb-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pt-16">
          <div>
            <h1 className="font-display max-w-3xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Save anything you want. See it all in one place.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Paste a product link from almost any store. Wishlist collects the useful details, lets
              you organise what you want, track savings, and come back when you're ready to buy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your wishlist <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-4 shadow-[0_18px_60px_rgba(34,31,28,0.08)]">
            <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <p className="font-display text-lg">Camera upgrade</p>
                  <p className="text-sm text-muted-foreground">3 stores, 2 saved prices</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Saving
                </span>
              </div>
              <div className="grid gap-3 pt-4">
                {[
                  ["Mirrorless body", "USD 1,199", "Saved 68%"],
                  ["Everyday lens", "USD 429", "Ready"],
                  ["Travel bag", "USD 149", "Watching"],
                ].map(([title, price, state]) => (
                  <div
                    key={title}
                    className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border/70 bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{price}</p>
                    </div>
                    <p className="self-center text-xs text-muted-foreground">{state}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border/70 bg-surface/60">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Step {index + 1}
                  </p>
                </div>
                <h2 className="font-display text-xl">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl">Everything useful, nothing locked away</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Wishlist keeps product details editable and gives you practical structure for deciding
              what matters, what can wait, and what you already bought.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-lg border border-border/70 bg-card p-4">
                <Icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="privacy" className="border-t border-border/70">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-primary">Privacy</p>
              <h2 className="font-display mt-2 text-3xl">Your wishlist is yours.</h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Each account has authenticated access to its own items, categories, collections,
                price history, and image metadata. Database policies and private storage paths are
                scoped by the signed-in user.
              </p>
              <p>
                Built by{" "}
                <a
                  href="https://github.com/YellankiKaushik"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary"
                >
                  Yellanki Kaushik
                </a>
                . Source code is available at{" "}
                <a
                  href="https://github.com/YellankiKaushik/Deseos-Kaaush"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary"
                >
                  GitHub
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
