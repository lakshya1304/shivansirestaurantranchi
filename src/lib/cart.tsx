import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  TABLE_COOKIE,
  TABLE_SOURCE_COOKIE,
  deleteCookie,
  getCookie,
  setCookie,
} from "@/lib/cookies";


export interface CartLine {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  weightLabel: string | null;
  weightGrams: number | null;
  instructions: string[];
}

export type TableSource = "qr" | "manual";

interface CartState {
  lines: CartLine[];
  tableNumber: number | null;
  tableSource: TableSource | null;
  count: number;
  subtotal: number;
  addLine: (line: Omit<CartLine, "key">) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  setInstructions: (key: string, instructions: string[]) => void;
  setTableNumber: (table: number | null, source?: TableSource) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "shivansi-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [tableNumber, setTableNumberState] = useState<number | null>(null);
  const [tableSource, setTableSource] = useState<TableSource | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
      const table = getCookie(TABLE_COOKIE);
      if (table && Number(table) > 0) {
        setTableNumberState(Number(table));
        setTableSource(getCookie(TABLE_SOURCE_COOKIE) === "qr" ? "qr" : "manual");
      }
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const setTableNumber = useCallback((table: number | null, source: TableSource = "manual") => {
    setTableNumberState(table);
    setTableSource(table == null ? null : source);
    if (table == null) {
      deleteCookie(TABLE_COOKIE);
      deleteCookie(TABLE_SOURCE_COOKIE);
    } else {
      // Table context lives for one sitting.
      setCookie(TABLE_COOKIE, String(table), 60 * 60 * 6);
      setCookie(TABLE_SOURCE_COOKIE, source, 60 * 60 * 6);
    }
  }, []);


  const addLine = useCallback((line: Omit<CartLine, "key">) => {
    const key = `${line.productId}::${line.weightLabel ?? "std"}::${line.instructions.join("|")}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l));
      }
      return [...prev, { ...line, key }];
    });
  }, []);

  const increment = useCallback((key: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)));
  }, []);

  const decrement = useCallback((key: string) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.key !== key) return [l];
        if (l.quantity <= 1) return [];
        return [{ ...l, quantity: l.quantity - 1 }];
      }),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const setInstructions = useCallback((key: string, instructions: string[]) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, instructions } : l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    return {
      lines,
      tableNumber,
      count,
      subtotal,
      addLine,
      increment,
      decrement,
      remove,
      setInstructions,
      setTableNumber,
      clear,
    };
  }, [lines, tableNumber, addLine, increment, decrement, remove, setInstructions, setTableNumber, clear]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
