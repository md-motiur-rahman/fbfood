"use client";

import { useState } from "react";
import Carousel, { type Slide } from "./components/Carousel";
import ProductCard from "./components/ProductCard";
import Navbar from "./components/Navbar";
import { inventoryCategories, inventoryProducts } from "./data/inventory";

const slides: Slide[] = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1548907040-4b7b09443896?q=80&w=1600&auto=format&fit=crop",
    href: "#top-selling",
    title: "Wholesale Chocolate Sale",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?q=80&w=1600&auto=format&fit=crop",
    href: "#whats-new",
    title: "Biscuit Bonanza",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    href: "#categories",
    title: "Seasonal Specials",
  },
];

const whatsNew = [
  { id: 1, name: "Dark Choco Bar 70%", img: "https://images.unsplash.com/photo-1612177572781-c280c3186750?q=80&w=800&auto=format&fit=crop", badge: "New" },
  { id: 2, name: "Butter Cookies", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop", badge: "New" },
  { id: 3, name: "Hazelnut Spread", img: "https://images.unsplash.com/photo-1572552633759-1b4a5f963d8e?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Choco Wafer Packs", img: "https://images.unsplash.com/photo-1625944529157-efb2b6194c0e?q=80&w=800&auto=format&fit=crop" },
];

const topSelling = [
  { id: 1, name: "Milk Choco Minis", img: "https://images.unsplash.com/photo-1548907040-4b7b09443896?q=80&w=800&auto=format&fit=crop", badge: "Best Seller" },
  { id: 2, name: "Oatmeal Cookies", img: "https://images.unsplash.com/photo-1461009209120-103138d8b874?q=80&w=800&auto=format&fit=crop", badge: "Hot" },
  { id: 3, name: "Caramel Bites", img: "https://images.unsplash.com/photo-1542528180-a1208c5169a0?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Choco Chip Cookies", img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop" },
];

export default function Home() {
  const handleAddToQuote = (id: number | string) => {
    // Placeholder for future cart/quote logic
    console.log("Add to quote:", id);
  };

  const latest = inventoryProducts.slice(-8).reverse();
  const topSell = [...inventoryProducts].sort((a, b) => b.itemquery - a.itemquery).slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />

      <main id="home">
        {/* Hero with Carousel */}
        <section className="relative w-full pt-0 pb-10">
          <Carousel items={slides} auto interval={6000} />
          {/* Search overlay */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-8 md:pt-16">
            <div className="pointer-events-auto mx-4 sm:mx-6 w-full max-w-2xl">
              <form action="/items" method="get" className="group flex items-center gap-3 rounded-full bg-white/95 backdrop-blur ring-1 ring-black/10 shadow-lg px-4 py-2 md:px-5 md:py-3">
                <label htmlFor="home-search" className="sr-only">Search products</label>
                <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-700 shadow-inner">🔎</span>
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Search products, categories, barcodes..."
                  className="w-full bg-transparent outline-none text-base md:text-lg placeholder:text-zinc-500"
                />
                <button type="submit" className="inline-flex h-11 md:h-12 items-center rounded-full bg-amber-500 px-5 md:px-6 text-sm md:text-base font-semibold text-zinc-900 shadow hover:bg-amber-400 whitespace-nowrap">
                  Search
                </button>
              </form>
                          </div>
          </div>
        </section>

        {/* Categories quick links */}
        <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categories</h2>
            <a href="/categories" className="text-sm font-medium text-amber-700 hover:underline">View all</a>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {inventoryCategories.map((c) => (
              <a
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-zinc-50"
              >
                {c.name}
              </a>
            ))}
          </div>
        </section>

        {/* What's New */}
        <section id="whats-new" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">What's New</h2>
            <a href="/whats-new" className="text-sm font-medium text-amber-700 hover:underline">View all</a>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {latest.map((p) => (
              <ProductCard
                key={p.outerbarcode}
                id={p.outerbarcode}
                name={p.productname}
                img={p.picture}
                badge="New"
                onAdd={handleAddToQuote}
                onDetailsHref={`/items/${p.outerbarcode}`}
              />
            ))}
          </div>
        </section>

        {/* Top Selling */}
        <section id="top-selling" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Top Selling</h2>
            <a href="/top-selling" className="text-sm font-medium text-amber-700 hover:underline">View all</a>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {topSell.map((p) => (
              <ProductCard
                key={p.outerbarcode}
                id={p.outerbarcode}
                name={p.productname}
                img={p.picture}
                onAdd={handleAddToQuote}
                onDetailsHref={`/items/${p.outerbarcode}`}
              />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faqs" className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">FAQ's</h2>
          <div className="mt-5 grid gap-3">
            <details className="rounded-lg border border-black/5 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold">Do you offer tiered bulk pricing?</summary>
              <p className="mt-2 text-sm text-zinc-600">Yes. Pricing improves at 50+, 200+, and 500+ units. Request a custom quote for pallet orders.</p>
            </details>
            <details className="rounded-lg border border-black/5 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold">What are the lead times?</summary>
              <p className="mt-2 text-sm text-zinc-600">Most orders dispatch within 24–48 hours. Transit times depend on your region and carrier.</p>
            </details>
            <details className="rounded-lg border border-black/5 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold">Can I get samples?</summary>
              <p className="mt-2 text-sm text-zinc-600">Sample packs are available for selected SKUs. Contact sales to arrange.</p>
            </details>
          </div>
        </section>
      </main>
    </div>
  );
}
