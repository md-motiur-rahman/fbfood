"use client";

import { useMemo } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { inventoryProducts } from "../data/inventory";

export default function WhatsNewPage() {
  // Latest 10 items (assumes array order is chronological)
  const latest = useMemo(() => inventoryProducts.slice(-10).reverse(), []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">What's New</h1>
            <p className="mt-1 text-sm text-zinc-600">Latest 10 arrivals to quickly stock your shelves.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/items" className="inline-flex h-9 items-center rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-zinc-50">All Items</a>
            <a href="/contact" className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">Get a Quote</a>
          </div>
        </header>

        {/* Grid */}
        <section className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {latest.map((p) => (
            <ProductCard
              key={p.outerbarcode}
              id={p.outerbarcode}
              name={p.productname}
              img={p.picture}
              badge="New"
              onAdd={() => {}}
              onDetailsHref={`/items/${p.outerbarcode}`}
            />
          ))}
          {latest.length === 0 && (
            <div className="col-span-full text-sm text-zinc-600">No new items at the moment. Check back soon!</div>
          )}
        </section>
      </main>
    </div>
  );
}
