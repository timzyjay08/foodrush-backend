import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartLine, MenuItem } from "@/data/types";

const CART_KEY = "foodrush.cart";
export const SERVICE_FEE = 300;

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  serviceFee: number;
  restaurantId: string | null;
  addItem: (item: MenuItem, quantity?: number, note?: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      window.localStorage.removeItem(CART_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback((item: MenuItem, quantity = 1, note?: string) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.id
            ? { ...line, quantity: line.quantity + quantity, ...(note ? { note } : {}) }
            : line,
        );
      }
      const line: CartLine = {
        menuItemId: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity,
        ...(note ? { note } : {}),
      };
      return [...prev, line];
    });
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.menuItemId !== menuItemId)
        : prev.map((line) => (line.menuItemId === menuItemId ? { ...line, quantity } : line)),
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      serviceFee: lines.length ? SERVICE_FEE : 0,
      restaurantId: lines[0]?.restaurantId ?? null,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [lines, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
