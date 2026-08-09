import { useState } from "react";
import { Clock, Flame, Leaf, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCart } from "@/lib/cart";
import { effectivePrice, money, weightPrice } from "@/lib/format";
import { productImage } from "@/lib/images";
import { COOKING_INSTRUCTIONS, WEIGHT_OPTIONS, type Product } from "@/lib/types";

export function ProductCard({
  product,
  categorySlug,
  currency,
}: {
  product: Product;
  categorySlug?: string | null;
  currency: string;
}) {
  const { addLine } = useCart();
  const [weight, setWeight] = useState(WEIGHT_OPTIONS[1]!);
  const [instructions, setInstructions] = useState<string[]>([]);

  const unitPrice = product.sold_by_weight
    ? weightPrice(product.price_per_kg ?? 0, weight.grams)
    : effectivePrice(product);
  const hasOffer = !product.sold_by_weight && product.offer_price != null && product.offer_price > 0;

  function toggleInstruction(value: string) {
    setInstructions((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]));
  }

  function add() {
    addLine({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      unitPrice,
      quantity: 1,
      weightLabel: product.sold_by_weight ? weight.label : null,
      weightGrams: product.sold_by_weight ? weight.grams : null,
      instructions,
    });
    toast.success(`${product.name} added to cart`, {
      description: product.sold_by_weight ? weight.label : instructions.join(", ") || undefined,
    });
    setInstructions([]);
  }

  return (
    <article className="group card-3d hover:card-3d-hover glass flex flex-col overflow-hidden rounded-3xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={productImage(product.image_url, categorySlug)}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant={product.is_veg ? "veg" : "nonveg"} className="glass">
            <Leaf className="mr-1 size-3" />
            {product.is_veg ? "Veg" : "Non-veg"}
          </Badge>
          {product.is_spicy ? (
            <Badge variant="warning">
              <Flame className="mr-1 size-3" /> Spicy
            </Badge>
          ) : null}
          {product.is_special ? <Badge variant="gold">Today's special</Badge> : null}
        </div>
        {!product.is_available ? (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Badge variant="destructive">Sold out today</Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-base font-bold leading-tight">{product.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
            <Star className="size-3 fill-current" />
            {Number(product.rating).toFixed(1)}
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {product.prep_time_mins} min
          </span>
          <span>{product.calories} kcal</span>
          <span>{product.review_count} reviews</span>
        </div>

        {product.sold_by_weight ? (
          <div className="flex flex-wrap gap-1.5">
            {WEIGHT_OPTIONS.map((w) => (
              <button
                key={w.label}
                type="button"
                onClick={() => setWeight(w)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  weight.label === w.label
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/60"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="font-display text-lg font-bold">{money(unitPrice, currency)}</div>
            {hasOffer ? (
              <div className="text-xs text-muted-foreground line-through">{money(product.price, currency)}</div>
            ) : product.sold_by_weight ? (
              <div className="text-[11px] text-muted-foreground">
                {money(product.price_per_kg ?? 0, currency)}/kg
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="glass" size="sm" disabled={!product.is_available}>
                  Notes{instructions.length ? ` (${instructions.length})` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 space-y-2">
                <p className="text-xs font-semibold">Cooking instructions</p>
                {COOKING_INSTRUCTIONS.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={`${product.id}-${option}`}
                      checked={instructions.includes(option)}
                      onCheckedChange={() => toggleInstruction(option)}
                    />
                    <Label htmlFor={`${product.id}-${option}`} className="text-xs font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            <Button variant="hero" size="sm" onClick={add} disabled={!product.is_available}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
