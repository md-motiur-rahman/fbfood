"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuote } from "@/app/components/quote/QuoteContext";

type Props = {
  productname: string;
  barcode: string;
  caseSize: string;
  available: boolean;
  brandSlug: string | null;
  brandName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
};

export default function ProductDetailClient({
  productname,
  barcode,
  caseSize,
  available,
  brandSlug,
  brandName,
  categorySlug,
  categoryName,
}: Props) {
  const [qty, setQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const { addItem } = useQuote();

  const adjust = (delta: number) => {
    setQty((q) => Math.max(1, q + delta));
  };

  const onAddToQuote = async () => {
    try {
      setSubmitting(true);
      // Add to client-side quote context with the selected quantity, using `barcode`
      addItem({ barcode, productname, picture: undefined }, qty);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {productname}
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          Pack &amp; Size: <span className="font-normal">{caseSize || "—"}</span>
        </p>

        {/* Quantity + Add to Quote / Wishlist */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-stretch rounded-full border border-black/10 bg-white text-sm">
            <button
              type="button"
              className="px-3 text-slate-700 hover:bg-slate-50"
              aria-label="Decrease quantity"
              onClick={() => adjust(-1)}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 border-x border-black/10 text-center outline-none"
            />
            <button
              type="button"
              className="px-3 text-slate-700 hover:bg-slate-50"
              aria-label="Increase quantity"
              onClick={() => adjust(1)}
            >
              +
            </button>
          </div>
          {available ? (
            <button
              type="button"
              disabled={submitting}
              onClick={onAddToQuote}
              className="inline-flex h-10 items-center justify-center rounded-full bg-sky-600 px-6 text-sm font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60 whitespace-nowrap"
            >
              + ADD TO QUOTE
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 gap-2 whitespace-nowrap"
            >
              <span className="text-rose-600">❤</span>
              Add to wishlist
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-600">
          <span className="font-semibold">Brand: </span>
          {brandSlug && brandName ? (
            <Link href={`/brands/${brandSlug}`} className="text-sky-700 hover:underline">
              {brandName}
            </Link>
          ) : (
            <span>—</span>
          )}
          <span className="mx-2">•</span>
          <span className="font-semibold">Category: </span>
          {categorySlug && categoryName ? (
            <Link href={`/categories/${categorySlug}`} className="text-sky-700 hover:underline">
              {categoryName}
            </Link>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
    </div>
  );
}
