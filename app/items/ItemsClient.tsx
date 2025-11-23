"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ClientAddToQuoteCard from "../components/ClientAddToQuoteCard";

const pageSizeOptions = [10, 20, 40, 80, 100];

type SortKey = "az" | "za";

export default function ItemsClient() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("az");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const searchParams = useSearchParams();
  const qRaw = (searchParams.get("q") || "").trim();
  const q = qRaw.toLowerCase();
  const [categoryInitializedFromQuery, setCategoryInitializedFromQuery] = useState(false);

  type Category = { name: string; slug: string };
  type Brand = { name: string; slug: string };
  type ProductLite = {
    productname: string;
    category: string;
    brand?: string | null;
    barcode: string;
    picture: string;
    status: "AVAILABLE" | "UNAVAILABLE";
  };
  type ListResponse<T> = { items: T[] };

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [items, setItems] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/categories?page=1&pageSize=1000&sort=name&order=asc`, { cache: "no-store" });
        const data: ListResponse<Category> & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load categories");
        setCategories((data.items || []).map((c) => ({ name: c.name, slug: c.slug })));
      } catch (e) {
        console.error(e);
      }
      try {
        const resB = await fetch(`/api/admin/brands?page=1&pageSize=1000&sort=name&order=asc`, { cache: "no-store" });
        const dataB: ListResponse<Brand> & { error?: string } = await resB.json();
        if (!resB.ok) throw new Error(dataB?.error || "Failed to load brands");
        setBrands((dataB.items || []).map((b) => ({ name: b.name, slug: b.slug })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: "1", pageSize: "1000" });
        if (q) params.set("q", q);
        const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        const data: ListResponse<ProductLite> & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load items");
        setItems(data.items || []);
      } catch (e) {
        setError((e as Error).message || "Failed to load items");
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  const filteredByCategory = useMemo(() => {
    if (category === "all") return items;
    return items.filter((p) => p.category === category);
  }, [category, items]);

  const searched = useMemo(() => {
    if (!q) return filteredByCategory;

    const exact = filteredByCategory.filter(
      (p) => p.productname.toLowerCase() === q || p.barcode.toLowerCase() === q
    );
    if (exact.length) return exact;

    const catMatch = categories.find(
      (c) => c.slug.toLowerCase() === q || c.name.toLowerCase() === q
    );
    if (catMatch) {
      if (category === "all" || category === catMatch.slug) {
        return items.filter((p) => p.category === catMatch.slug);
      }
      return filteredByCategory;
    }

    const brandMatch = brands.find(
      (b) => b.slug.toLowerCase() === q || b.name.toLowerCase() === q
    );
    if (brandMatch) {
      const byBrand = filteredByCategory.filter((p) => (p.brand || "").toLowerCase() === brandMatch.slug.toLowerCase());
      if (byBrand.length) return byBrand;
    }

    const similarByName = filteredByCategory.filter((p) =>
      p.productname.toLowerCase().includes(q)
    );
    if (similarByName.length) return similarByName;

    const similarByCategoryName = filteredByCategory.filter((p) => {
      const cat = categories.find((c) => c.slug === p.category);
      return cat ? cat.name.toLowerCase().includes(q) : false;
    });
    if (similarByCategoryName.length) return similarByCategoryName;

    const similarByBrandName = filteredByCategory.filter((p) => {
      const b = brands.find((br) => br.slug === (p.brand || ""));
      return b ? b.name.toLowerCase().includes(q) : false;
    });
    if (similarByBrandName.length) return similarByBrandName;

    return filteredByCategory;
  }, [filteredByCategory, q, category, categories, items, brands]);

  const sorted = useMemo(() => {
    const copy = [...searched];
    copy.sort((a, b) => a.productname.localeCompare(b.productname));
    return sort === "az" ? copy : copy.reverse();
  }, [searched, sort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [category, sort, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!categoryInitializedFromQuery) {
      if (q) {
        const match = categories.find(
          (c) => c.slug.toLowerCase() === q || c.name.toLowerCase() === q
        );
        if (match) setCategory(match.slug);
      }
      setCategoryInitializedFromQuery(true);
    }
  }, [q, categoryInitializedFromQuery, categories]);

  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const currentItems = sorted.slice(startIdx, endIdx);

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const renderPageButtons = () => {
    const buttons: ReactNode[] = [];
    const maxButtons = 7;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) {
      const active = i === page;
      buttons.push(
        <button
          key={i}
          onClick={() => goTo(i)}
          className={`h-9 min-w-9 rounded-full border px-3 text-sm font-medium ${
            active
              ? "border-amber-500 bg-amber-50 text-zinc-900"
              : "border-black/10 text-zinc-700 hover:bg-zinc-50"
          }`}
          aria-current={active ? "page" : undefined}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Page Header */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Items</h1>
          <p className="mt-1 text-sm text-zinc-600">Browse the full catalog. Pricing confirmed based on order quantity.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/categories" className="inline-flex h-9 items-center rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-zinc-50">Categories</Link>
          <Link href="/contact" className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">Get a Quote</Link>
        </div>
      </header>

      {/* Layout: Filters + Items */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Filters: top on mobile, sidebar on desktop */}
        <aside className="md:col-span-3">
          <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm md:sticky md:top-20">
            <div className="text-sm font-semibold">Filters</div>
            <div className="mt-3 grid gap-3">
              {/* Category */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-600">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </label>

              {/* Sort */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-600">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="az">Name A → Z</option>
                  <option value="za">Name Z → A</option>
                </select>
              </label>

              {/* Per page */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-600">Per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                  className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              {/* Meta */}
              <div className="text-xs text-zinc-600">
                Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
              </div>
            </div>
          </div>
        </aside>

        {/* Items */}
        <div className="md:col-span-9">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
            {loading && <div className="col-span-full text-sm text-zinc-600">Loading...</div>}
            {error && <div className="col-span-full text-sm text-red-600">{error}</div>}
            {!loading && !error && currentItems.map((p) => (
              <ClientAddToQuoteCard
                key={p.barcode}
                id={p.barcode}
                name={p.productname}
                img={p.picture}
                available={p.status === "AVAILABLE"}
                onDetailsHref={`/items/${p.barcode}`}
              />
            ))}
            {total === 0 && (
              <div className="col-span-full text-sm text-zinc-600">No items found.</div>
            )}
          </div>
        </div>
      </section>

      {/* Pagination centered at bottom */}
      <nav className="mt-8 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="h-9 rounded-full border border-black/10 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
          >
            Prev
          </button>
          <div className="flex items-center gap-1">
            {renderPageButtons()}
          </div>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            className="h-9 rounded-full border border-black/10 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
          >
            Next
          </button>
        </div>
      </nav>
    </main>
  );
}
