import { useMemo } from "react";
import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  addLine,
  increment,
  decrement,
  remove,
  setInstructions,
  clear,
  setTableNumber,
  CartLine,
  TableSource
} from "@/store/slices/cartSlice";

export type { CartLine, TableSource };

interface CartStateObj {
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

export function CartProvider({ children }: { children: ReactNode }) {
  // We no longer provide context here; everything is in Redux.
  // We just return children.
  return <>{children}</>;
}

export function useCart(): CartStateObj {
  const dispatch = useDispatch();
  const cartState = useSelector((state: RootState) => state.cart);

  const count = useMemo(() => cartState.lines.reduce((sum, l) => sum + l.quantity, 0), [cartState.lines]);
  const subtotal = useMemo(() => cartState.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cartState.lines]);

  return {
    lines: cartState.lines,
    tableNumber: cartState.tableNumber,
    tableSource: cartState.tableSource,
    count,
    subtotal,
    addLine: (line) => dispatch(addLine(line)),
    increment: (key) => dispatch(increment(key)),
    decrement: (key) => dispatch(decrement(key)),
    remove: (key) => dispatch(remove(key)),
    setInstructions: (key, instructions) => dispatch(setInstructions({ key, instructions })),
    setTableNumber: (table, source) => dispatch(setTableNumber({ table, source })),
    clear: () => dispatch(clear()),
  };
}

