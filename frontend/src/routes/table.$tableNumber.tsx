import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/table/$tableNumber")({
  head: () => ({
    meta: [
      { title: "Your table — Maa Tara Sweets" },
      { name: "description", content: "Start a dine-in order for your table at Maa Tara Sweets." },
      { property: "og:title", content: "Your table — Maa Tara Sweets" },
      { property: "og:description", content: "Start a dine-in order for your table at Maa Tara Sweets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TableEntry,
});

function TableEntry() {
  const { tableNumber } = Route.useParams();
  const { setTableNumber } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const parsed = Number(tableNumber);
    if (Number.isFinite(parsed) && parsed > 0) setTableNumber(parsed, "qr");
    const timer = setTimeout(() => navigate({ to: "/menu", search: { category: undefined }, replace: true }), 1200);
    return () => clearTimeout(timer);
  }, [tableNumber, setTableNumber, navigate]);


  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <div className="glass animate-rise rounded-3xl px-10 py-12 text-center">
        <span className="mx-auto grid size-16 animate-pulse-ring place-items-center rounded-full bg-[image:var(--gradient-primary)]">
          <QrCode className="size-7 text-primary-foreground" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold">Table {tableNumber} connected</h1>
        <p className="mt-2 text-sm text-muted-foreground">Opening the menu for your table…</p>
      </div>
    </main>
  );
}
