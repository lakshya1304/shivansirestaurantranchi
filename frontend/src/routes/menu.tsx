import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MenuExplorer } from "@/components/menu-explorer";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/menu")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Menu — Maa Tara Sweets" },
      {
        name: "description",
        content:
          "Breakfast, snacks, main course, sweets, drinks, desserts and combos with live prices, prep time and veg badges.",
      },
      { property: "og:title", content: "Menu — Maa Tara Sweets" },
      {
        property: "og:description",
        content: "Browse the full Maa Tara Sweets menu and order from your table.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/menu" });

  function handleCategoryChange(slug: string) {
    void navigate({
      search: (prev) => ({ ...prev, category: slug === "all" ? undefined : slug }),
      replace: true,
    });
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Our menu</h1>
          <p className="text-sm text-muted-foreground">
            Everything is prepared to order. Sweets are priced by weight and packed fresh.
          </p>
        </header>
        <MenuExplorer
          {...(category ? { initialCategory: category } : {})}
          onCategoryChange={handleCategoryChange}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
