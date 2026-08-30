export function money(value: number, currency = "₹") {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  return `${currency}${rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function effectivePrice(product: { price: number; offer_price: number | null }) {
  return product.offer_price != null && product.offer_price > 0
    ? product.offer_price
    : product.price;
}

export function weightPrice(pricePerKg: number, grams: number) {
  return Math.round((pricePerKg * grams) / 1000);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}
