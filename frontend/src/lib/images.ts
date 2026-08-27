// ---------------------------------------------------------------------------
// Image helpers — no local asset files needed.
// Placeholder URLs point to reliable, royalty-free food images from Unsplash.
// Replace these with your actual CDN / imgbb URLs once photos are uploaded.
// ---------------------------------------------------------------------------

const HERO_URL =
  "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80"; // Thali spread
const CAT_SWEETS_URL =
  "https://images.unsplash.com/photo-1585237672814-8f85a8118bf6?w=800&q=80"; // Indian mithai
const CAT_MAIN_URL =
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80"; // Dal makhani
const CAT_SNACKS_URL =
  "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"; // Samosa

export const HERO_IMAGE = HERO_URL;

const BY_SLUG: Record<string, string> = {
  "sweet-shop": CAT_SWEETS_URL,
  desserts: CAT_SWEETS_URL,
  "main-course": CAT_MAIN_URL,
  combos: CAT_MAIN_URL,
  breakfast: CAT_SNACKS_URL,
  snacks: CAT_SNACKS_URL,
  drinks: CAT_SWEETS_URL,
};

export function fallbackImage(slug?: string | null) {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  return CAT_MAIN_URL;
}

export function productImage(imageUrl: string | null, slug?: string | null) {
  return imageUrl && imageUrl.trim().length > 0 ? imageUrl : fallbackImage(slug);
}
