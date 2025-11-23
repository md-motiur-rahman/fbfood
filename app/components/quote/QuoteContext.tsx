"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type QuoteItem = {
  barcode: string;
  productname: string;
  picture?: string | null;
  quantity: number;
};

export type QuoteContextValue = {
  items: QuoteItem[];
  totalCount: number;
  addItem: (item: { barcode: string; productname: string; picture?: string | null }, qty?: number) => void;
  updateQuantity: (barcode: string, qty: number) => void;
  removeItem: (barcode: string) => void;
  clear: () => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

const STORAGE_KEY = "fbfood_quote_v1";

function loadFromStorage(): QuoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => ({
        barcode: String((it as any)?.barcode || (it as any)?.outerbarcode || "").trim(),
        productname: String((it as any)?.productname || "").trim(),
        picture: (it as any)?.picture || null,
        quantity: Number((it as any)?.quantity || 0),
      }))
      .filter((it) => it.barcode && it.productname && it.quantity > 0);
  } catch {
    return [];
  }
}

function saveToStorage(items: QuoteItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);

  // load on mount
  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  // persist
  useEffect(() => {
    if (typeof window !== "undefined") saveToStorage(items);
  }, [items]);

  const totalCount = useMemo(() => items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0), [items]);

  function addItem(item: { barcode: string; productname: string; picture?: string | null }, qty = 1) {
    const quantity = Math.max(1, Number(qty));
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.barcode === item.barcode);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { barcode: item.barcode, productname: item.productname, picture: item.picture ?? null, quantity }];
    });
  }

  function updateQuantity(barcode: string, qty: number) {
    const q = Math.max(0, Math.floor(Number(qty)));
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.barcode === barcode);
      if (idx < 0) return prev;
      const next = [...prev];
      if (q <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], quantity: q };
      return next;
    });
  }

  function removeItem(barcode: string) {
    setItems((prev) => prev.filter((p) => p.barcode !== barcode));
  }

  function clear() {
    setItems([]);
  }

  const value: QuoteContextValue = useMemo(
    () => ({ items, totalCount, addItem, updateQuantity, removeItem, clear }),
    [items, totalCount]
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) {
    // Provide a safe fallback so components don’t crash if provider not mounted
    return {
      items: [],
      totalCount: 0,
      addItem: () => {},
      updateQuantity: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
