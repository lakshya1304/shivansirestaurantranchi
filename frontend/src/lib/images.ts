// ---------------------------------------------------------------------------
// Image helpers — uses public/assets/ for category & hero images.
// Individual product images still come from the backend (imgbb CDN).
// ---------------------------------------------------------------------------

export const HERO_IMAGE = "/assets/hero-food.jpg";

const BY_SLUG: Record<string, string> = {
  "sweet-shop": "/assets/cat-sweets.jpg",
  desserts: "/assets/cat-sweets.jpg",
  "main-course": "/assets/cat-main.jpg",
  combos: "/assets/cat-main.jpg",
  breakfast: "/assets/cat-snacks.jpg",
  snacks: "/assets/cat-snacks.jpg",
  drinks: "/assets/cat-sweets.jpg",
};

export function fallbackImage(slug?: string | null) {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  return "/assets/cat-main.jpg";
}

export function productImage(imageUrl: string | null, slug?: string | null) {
  return imageUrl && imageUrl.trim().length > 0 ? imageUrl : fallbackImage(slug);
}
