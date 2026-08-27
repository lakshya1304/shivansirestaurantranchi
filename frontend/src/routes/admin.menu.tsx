import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { categoriesQuery, productsQuery, settingsQuery } from "@/lib/db";
import { useDeleteRow, useSaveRow } from "@/lib/admin";
import { money } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export const Route = createFileRoute("/admin/menu")({
  component: MenuManager,
});

const emptyProduct = {
  name: "",
  description: "",
  image_url: "",
  price: 0,
  offer_price: null as number | null,
  prep_time_mins: 15,
  calories: 0,
  is_available: true,
  is_veg: true,
  is_spicy: false,
  is_special: false,
  is_popular: false,
  is_recommended: false,
  sold_by_weight: false,
  price_per_kg: null as number | null,
  sort_order: 0,
  category_id: null as string | null,
};

function MenuManager() {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const currency = settings?.currency ?? "₹";

  const saveProduct = useSaveRow("products", "products", "Menu item saved");
  const deleteProduct = useDeleteRow("products", "products");
  const saveCategory = useSaveRow("categories", "categories", "Category saved");
  const deleteCategory = useDeleteRow("categories", "categories");

  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [category, setCategory] = useState<Record<string, unknown> | null>(null);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Categories</h2>
            <p className="text-sm text-muted-foreground">Sections shown on the customer menu.</p>
          </div>
          <Dialog
            open={category !== null}
            onOpenChange={(open) => setCategory(open ? (category ?? { name: "", slug: "", description: "", image_url: "", sort_order: categories.length + 1, is_active: true }) : null)}
          >
            <DialogTrigger asChild>
              <Button variant="hero" className="rounded-full">
                <Plus className="size-4" /> New category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{category?.["id"] ? "Edit category" : "New category"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Field label="Name">
                  <Input
                    value={String(category?.["name"] ?? "")}
                    onChange={(e) =>
                      setCategory({
                        ...category,
                        name: e.target.value,
                        slug: category?.["id"]
                          ? category["slug"]
                          : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      })
                    }
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    value={String(category?.["slug"] ?? "")}
                    onChange={(e) => setCategory({ ...category, slug: e.target.value })}
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={String(category?.["description"] ?? "")}
                    onChange={(e) => setCategory({ ...category, description: e.target.value })}
                  />
                </Field>
                <Field label="Image URL">
                  <Input
                    value={String(category?.["image_url"] ?? "")}
                    onChange={(e) => setCategory({ ...category, image_url: e.target.value })}
                  />
                </Field>
                <Field label="Sort order">
                  <Input
                    type="number"
                    value={Number(category?.["sort_order"] ?? 0)}
                    onChange={(e) => setCategory({ ...category, sort_order: Number(e.target.value) })}
                  />
                </Field>
                <Toggle
                  label="Visible on menu"
                  checked={Boolean(category?.["is_active"])}
                  onChange={(v) => setCategory({ ...category, is_active: v })}
                />
                <Button
                  variant="hero"
                  className="w-full rounded-full"
                  onClick={() =>
                    saveCategory.mutate(category!, { onSuccess: () => setCategory(null) })
                  }
                >
                  Save category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c: Category) => (
            <div key={c.id} className="glass flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {products.filter((p) => p.category_id === c.id).length} items •{" "}
                  {c.is_active ? "visible" : "hidden"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="glass" className="size-8" onClick={() => setCategory({ ...c })}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="glass"
                  className="size-8"
                  onClick={() => deleteCategory.mutate(c.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Menu items</h2>
            <p className="text-sm text-muted-foreground">
              Add dishes and sweets, set prices, offers and availability.
            </p>
          </div>
          <Dialog
            open={product !== null}
            onOpenChange={(open) => setProduct(open ? (product ?? { ...emptyProduct }) : null)}
          >
            <DialogTrigger asChild>
              <Button variant="hero" className="rounded-full">
                <Plus className="size-4" /> New item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{product?.["id"] ? "Edit item" : "New item"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Field label="Name">
                  <Input
                    value={String(product?.["name"] ?? "")}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={String(product?.["description"] ?? "")}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={String(product?.["category_id"] ?? "")}
                    onChange={(e) => setProduct({ ...product, category_id: e.target.value || null })}
                  >
                    <option value="">Uncategorised</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Image URL">
                  <Input
                    value={String(product?.["image_url"] ?? "")}
                    onChange={(e) => setProduct({ ...product, image_url: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price">
                    <Input
                      type="number"
                      value={Number(product?.["price"] ?? 0)}
                      onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Offer price">
                    <Input
                      type="number"
                      value={Number(product?.["offer_price"] ?? 0)}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          offer_price: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Prep time (mins)">
                    <Input
                      type="number"
                      value={Number(product?.["prep_time_mins"] ?? 0)}
                      onChange={(e) => setProduct({ ...product, prep_time_mins: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Calories">
                    <Input
                      type="number"
                      value={Number(product?.["calories"] ?? 0)}
                      onChange={(e) => setProduct({ ...product, calories: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <Toggle
                  label="Sold by weight (sweets)"
                  checked={Boolean(product?.["sold_by_weight"])}
                  onChange={(v) => setProduct({ ...product, sold_by_weight: v })}
                />
                {product?.["sold_by_weight"] ? (
                  <Field label="Price per kg">
                    <Input
                      type="number"
                      value={Number(product?.["price_per_kg"] ?? 0)}
                      onChange={(e) => setProduct({ ...product, price_per_kg: Number(e.target.value) })}
                    />
                  </Field>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Toggle
                    label="Available"
                    checked={Boolean(product?.["is_available"])}
                    onChange={(v) => setProduct({ ...product, is_available: v })}
                  />
                  <Toggle
                    label="Vegetarian"
                    checked={Boolean(product?.["is_veg"])}
                    onChange={(v) => setProduct({ ...product, is_veg: v })}
                  />
                  <Toggle
                    label="Spicy"
                    checked={Boolean(product?.["is_spicy"])}
                    onChange={(v) => setProduct({ ...product, is_spicy: v })}
                  />
                  <Toggle
                    label="Today's special"
                    checked={Boolean(product?.["is_special"])}
                    onChange={(v) => setProduct({ ...product, is_special: v })}
                  />
                  <Toggle
                    label="Popular"
                    checked={Boolean(product?.["is_popular"])}
                    onChange={(v) => setProduct({ ...product, is_popular: v })}
                  />
                  <Toggle
                    label="Recommended"
                    checked={Boolean(product?.["is_recommended"])}
                    onChange={(v) => setProduct({ ...product, is_recommended: v })}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full rounded-full"
                  onClick={() => saveProduct.mutate(product!, { onSuccess: () => setProduct(null) })}
                >
                  Save item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="glass overflow-x-auto rounded-3xl p-4">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-center">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: Product) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2">
                    <span className="font-medium">{p.name}</span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.is_special ? <Badge variant="gold">Special</Badge> : null}
                      {p.sold_by_weight ? <Badge variant="glass">By weight</Badge> : null}
                    </div>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {categories.find((c) => c.id === p.category_id)?.name ?? "—"}
                  </td>
                  <td className="py-2 text-right">
                    {p.sold_by_weight
                      ? `${money(p.price_per_kg ?? 0, currency)}/kg`
                      : money(p.offer_price ?? p.price, currency)}
                  </td>
                  <td className="py-2 text-center">
                    <Switch
                      checked={p.is_available}
                      onCheckedChange={(v) => saveProduct.mutate({ id: p.id, is_available: v })}
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="glass"
                        className="size-8"
                        onClick={() => setProduct({ ...p })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="glass"
                        className="size-8"
                        onClick={() => deleteProduct.mutate(p.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
