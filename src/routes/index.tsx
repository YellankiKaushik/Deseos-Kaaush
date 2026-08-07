import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Link2, Sparkles, Target, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AspireList — Save what you want, plan how you'll get it" },
      {
        name: "description",
        content:
          "Paste a link from any store. AspireList pulls in the details, keeps everything on one calm visual board, and tracks your savings until it's yours.",
      },
      { property: "og:title", content: "AspireList — Save what you want, plan how you'll get it" },
      {
        property: "og:description",
        content:
          "A private visual dashboard for the things you're working towards: products, experiences, and life goals in one place.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <span className="font-display text-xl">
          Aspire<span className="text-primary">List</span>
        </span>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create my dashboard
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-20 sm:pt-20">
        <div className="max-w-2xl">
          <p className="text-muted-foreground mb-5 text-sm tracking-[0.18em] uppercase">
            A personal acquisition dashboard
          </p>
          <h1 className="font-display text-4xl leading-[1.08] sm:text-6xl">
            Everything you're working towards, on one quiet board.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
            Paste a link from any store. AspireList reads what it can, you correct the rest, and the
            item becomes a card you'll still care about in five years — with the reason you wanted
            it and the savings behind it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start your list <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-3">
          {[
            {
              icon: Link2,
              title: "Paste a link",
              body: "Any product, experience, or service page from anywhere on the web.",
            },
            {
              icon: Sparkles,
              title: "Review the details",
              body: "We pull title, price, and imagery when we can. You always have the final say.",
            },
            {
              icon: Target,
              title: "Plan and achieve",
              body: "Prioritise, set a target date, log savings, and archive it as a win.",
            },
          ].map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="space-y-3">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Step {index + 1}
              </p>
              <h2 className="font-display text-xl">{title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl">Built to last years, not weeks</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Collections for the bigger picture. Categories for the everyday. Price history so you
            know when something drops. A purchased archive so the list becomes a record of what you
            actually achieved.
          </p>
        </div>
        <ul className="space-y-4">
          {[
            "Universal wishlist across every store",
            "Priority levels from casual to dream",
            "Savings progress towards each target",
            "Purchased items kept as achievements",
            "Private, searchable personal catalogue",
          ].map((line) => (
            <li
              key={line}
              className="bg-card elevated rounded-lg border border-border/70 px-4 py-3 text-sm"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 py-14">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" /> Private by default
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Your list belongs to you alone. Every item, note, and saving amount is locked to your
            account and never shown to anyone else.
          </p>
          <Button asChild className="mt-2">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create my dashboard
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
