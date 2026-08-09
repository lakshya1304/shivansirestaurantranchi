import heroFood from "@/assets/hero-food.jpg";
import catSweets from "@/assets/cat-sweets.jpg";
import catMain from "@/assets/cat-main.jpg";
import catSnacks from "@/assets/cat-snacks.jpg";

export const HERO_IMAGE = heroFood;

const BY_SLUG: Record<string, string> = {
  "sweet-shop": catSweets,
  desserts: catSweets,
  "main-course": catMain,
  combos: catMain,
  breakfast: catSnacks,
  snacks: catSnacks,
  drinks: catSweets,
};

export function fallbackImage(slug?: string | null) {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  return catMain;
}

export function productImage(imageUrl: string | null, slug?: string | null) {
  return imageUrl && imageUrl.trim().length > 0 ? imageUrl : fallbackImage(slug);
}
