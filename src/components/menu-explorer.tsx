import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product-card";
import { categoriesQuery, productsQuery, settingsQuery } from "@/lib/db";

type DietFilter = "all" | "veg" | "nonveg";

export function MenuExplorer({ initialCategory }: { initialCategory?: string }) {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: products, isPending } = useQuery(productsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [diet, setDiet] = useState<DietFilter>("all");

  const currency = settings?.currency ?? "₹";

  const filtered = useMemo(() => {
    const list = products ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      const cat = categories.find((c) => c.id === p.category_id);
      if (category !== "all" && cat?.slug !== category) return false;
      if (diet === "veg" && !p.is_veg) return false;
      if (diet === "nonveg" && p.is_veg) return false;
      if (term && !`${p.name} ${p.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, categories, category, diet, search]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for poha, paneer, kaju katli…"
            className="h-11 rounded-full pl-9"
            maxLength={60}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "veg", "nonveg"] as DietFilter[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiet(d)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                diet === d ? "border-primary bg-primary/20" : "border-border text-muted-foreground"
              }`}
            >
              {d === "all" ? "All" : d === "veg" ? "Veg" : "Non-veg"}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
            category === "all" ? "border-primary bg-primary/20" : "border-border text-muted-foreground"
          }`}
        >
          Everything
        </button>
        {categories
          .filter((c) => c.is_active)
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                category === c.slug ? "border-primary bg-primary/20" : "border-border text-muted-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
      </div>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-3xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
          Nothing matches that search yet. Try another dish or category.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              currency={currency}
              categorySlug={categories.find((c) => c.id === p.category_id)?.slug ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
