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
  const [added, setAdded] = useState(false);
  const { addItem } = useQuote();

  const adjust = (delta: number) => {
    setQty((q) => Math.max(1, q + delta));
  };

  const onAddToQuote = () => {
    if (!available) return;
    addItem({ barcode, productname, picture: undefined }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Brand & Category Badges */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs font-medium tracking-wide uppercase text-slate-500">
          {brandSlug && brandName && (
            <Link
              href={`/brands/${brandSlug}`}
              className="hover:text-sky-600 transition-colors"
            >
              {brandName}
            </Link>
          )}
          {brandSlug && categorySlug && <span>•</span>}
          {categorySlug && categoryName && (
            <Link
              href={`/categories/${categorySlug}`}
              className="hover:text-sky-600 transition-colors"
            >
              {categoryName}
            </Link>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
          {productname}
        </h1>
        
        <div className="mt-4 flex items-center gap-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {available ? 'In Stock' : 'Out of Stock'}
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <p className="text-sm font-medium text-slate-600">
            Pack Size: <span className="text-slate-900">{caseSize || "—"}</span>
            </p>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full"></div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => adjust(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            aria-label="Decrease quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-14 bg-transparent text-center font-bold text-slate-900 outline-none"
          />
          <button
            type="button"
            onClick={() => adjust(1)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            aria-label="Increase quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>

        {/* Add Button */}
        {available ? (
          <button
            type="button"
            onClick={onAddToQuote}
            className={`flex-1 h-12 px-8 rounded-xl font-bold text-white shadow-lg shadow-sky-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                added ? 'bg-green-500 hover:bg-green-600' : 'bg-sky-600 hover:bg-sky-500'
            }`}
          >
            {added ? (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    Added to Quote
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Add to Quote
                </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="flex-1 h-12 px-8 rounded-xl font-bold border-2 border-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
            disabled
          >
            Out of Stock
          </button>
        )}
        
        <button 
            type="button"
            className="h-12 w-12 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
            title="Add to Wishlist"
        >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>
      </div>
    </div>
  );
}
