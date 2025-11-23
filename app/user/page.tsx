"use client";

import Link from "next/link";

export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 grid gap-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">Quick access to your quotes and browsing tools.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/user/quotes"
              className="inline-flex items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400"
            >
              Your quotes
            </Link>
            <Link
              href="/quote"
              className="inline-flex items-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-amber-50"
            >
              Current quote list
            </Link>
            <Link
              href="/items"
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Browse products
            </Link>
          </div>
        </header>

        {/* Quick links */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/items"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm hover:bg-zinc-50 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-500 uppercase">Catalog</span>
            <span className="text-sm font-semibold">Browse all items</span>
            <span className="text-xs text-zinc-600">Search and explore the full FBFOOD catalog.</span>
          </Link>
          <Link
            href="/categories"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm hover:bg-zinc-50 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-500 uppercase">Categories</span>
            <span className="text-sm font-semibold">Shop by category</span>
            <span className="text-xs text-zinc-600">Find products grouped by type for easier browsing.</span>
          </Link>
          <Link
            href="/brands"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm hover:bg-zinc-50 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-500 uppercase">Brands</span>
            <span className="text-sm font-semibold">Explore brands</span>
            <span className="text-xs text-zinc-600">See items available from each brand.</span>
          </Link>
          <Link
            href="/promotion/monthly"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm hover:bg-zinc-50 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-500 uppercase">Promotions</span>
            <span className="text-sm font-semibold">Monthly promotions</span>
            <span className="text-xs text-zinc-600">Check out this month&apos;s featured deals.</span>
          </Link>
          <Link
            href="/promotion/seasonal"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm hover:bg-zinc-50 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-500 uppercase">Promotions</span>
            <span className="text-sm font-semibold">Seasonal offers</span>
            <span className="text-xs text-zinc-600">See products highlighted for the current season.</span>
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm hover:bg-zinc-50 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-500 uppercase">Support</span>
            <span className="text-sm font-semibold">Contact sales</span>
            <span className="text-xs text-zinc-600">Get in touch for special pricing or large orders.</span>
          </Link>
        </section>

        {/* Info panel */}
        <section className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4 text-sm text-zinc-800 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1">How quotes work</h2>
          <p className="text-xs text-zinc-700">
            Add any products you are interested in to your quote list. Once you submit your quote, a member of our team will
            review your request, confirm pricing based on quantities and freight, and get back to you as soon as possible.
          </p>
        </section>
      </main>
    </div>
  );
}
