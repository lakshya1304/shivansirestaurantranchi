import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, QrCode, Sparkles, Star, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { MenuExplorer } from "@/components/menu-explorer";
import { SiteFooter } from "@/components/site-footer";
import { activeOffers, categoriesQuery, offersQuery, productsQuery, reviewsQuery, settingsQuery } from "@/lib/db";
import { HERO_IMAGE, fallbackImage } from "@/lib/images";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shivansi Restaurant & Sweet Shop — Scan, Order, Enjoy" },
      {
        name: "description",
        content:
          "Order Indian breakfast, snacks, main course and fresh mithai straight from your table QR code. Live order tracking and festival offers.",
      },
      { property: "og:title", content: "Shivansi Restaurant & Sweet Shop — Scan, Order, Enjoy" },
      {
        property: "og:description",
        content: "Order Indian breakfast, snacks, main course and fresh mithai straight from your table QR code. Live order tracking and festival offers.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: offers = [] } = useQuery(offersQuery);
  const { data: reviews = [] } = useQuery(reviewsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const { tableNumber } = useCart();

  const currency = settings?.currency ?? "₹";
  const live = activeOffers(offers);
  const specials = products.filter((p) => p.is_special && p.is_available).slice(0, 3);
  const popular = products.filter((p) => p.is_popular && p.is_available).slice(0, 6);
  const recommended = products.filter((p) => p.is_recommended && p.is_available).slice(0, 3);
  const slugOf = (id: string | null) => categories.find((c) => c.id === id)?.slug ?? null;

  return (
    <main>
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="animate-rise space-y-6">
            {tableNumber ? (
              <Badge variant="gold" className="gap-1.5">
                <QrCode className="size-3.5" /> You're seated at table {tableNumber}
              </Badge>
            ) : (
              <Badge variant="glass" className="gap-1.5">
                <Sparkles className="size-3.5 text-accent" /> Scan the QR on your table to start
              </Badge>
            )}
            <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              {settings?.name ?? "Shivansi Restaurant & Sweet Shop"}
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              {settings?.tagline ?? "Sweets, spice and everything nice"} — freshly cooked Indian classics and
              hand-made mithai, ordered from your seat and tracked live until it reaches your table.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/menu" search={{ category: undefined }}>
                  Explore the menu <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg" className="rounded-full">
                <Link to="/my-orders">Track my order</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Star className="size-4 text-accent" /> 4.8 average rating
              </span>
              <span className="flex items-center gap-2">
                <Timer className="size-4 text-accent" /> Live kitchen tracking
              </span>
            </div>
          </div>

          <div className="relative animate-float">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[image:var(--gradient-primary)] opacity-30 blur-3xl" />
            <img
              src={HERO_IMAGE}
              alt="Signature Indian thali served with fresh kaju katli sweets"
              width={1600}
              height={1104}
              className="w-full rounded-[2.5rem] border border-border object-cover shadow-[var(--shadow-glow)]"
            />
          </div>
        </div>
      </section>

      {live.length > 0 ? (
        <section className="px-4 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
            {live.map((offer) => (
              <div
                key={offer.id}
                className="glass card-3d hover:card-3d-hover relative overflow-hidden rounded-3xl p-6"
              >
                <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-gold)] opacity-15" />
                <Badge variant="gold">{offer.discount_percent}% OFF</Badge>
                <h2 className="mt-3 font-display text-2xl font-bold">{offer.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {offer.coupon_code ? (
                    <span className="rounded-full border border-dashed border-accent px-3 py-1 font-mono text-accent">
                      {offer.coupon_code}
                    </span>
                  ) : null}
                  {offer.starts_at && offer.ends_at ? (
                    <span>
                      Valid {new Date(offer.starts_at).toLocaleDateString("en-IN")} –{" "}
                      {new Date(offer.ends_at).toLocaleDateString("en-IN")}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {specials.length > 0 ? (
        <Section title="Today's special" subtitle="Chef's picks, made fresh this morning">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {specials.map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} categorySlug={slugOf(p.category_id)} />
            ))}
          </div>
        </Section>
      ) : null}

      {popular.length > 0 ? (
        <Section title="Most loved" subtitle="What our guests order again and again">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} categorySlug={slugOf(p.category_id)} />
            ))}
          </div>
        </Section>
      ) : null}

      {recommended.length > 0 ? (
        <Section title="Recommended for you" subtitle="Balanced pairings from our kitchen">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} categorySlug={slugOf(p.category_id)} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Browse by category" subtitle="From morning poha to midnight mithai">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories
            .filter((c) => c.is_active)
            .map((c) => (
              <Link
                key={c.id}
                to="/menu"
                search={{ category: c.slug }}
                className="group card-3d hover:card-3d-hover relative overflow-hidden rounded-3xl border border-border"
              >
                <img
                  src={c.image_url || fallbackImage(c.slug)}
                  alt={c.name}
                  loading="lazy"
                  className="h-40 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="font-display text-lg font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </Section>

      <Section title="Full menu" subtitle="Search, filter and add straight to your cart">
        <MenuExplorer />
      </Section>

      {reviews.length > 0 ? (
        <Section title="Guest reviews" subtitle="Straight from our tables">
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <blockquote key={r.id} className="glass rounded-3xl p-6">
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">"{r.comment}"</p>
                <footer className="mt-4 text-sm font-semibold">{r.customer_name}</footer>
              </blockquote>
            ))}
          </div>
        </Section>
      ) : null}

      <SiteFooter />
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
