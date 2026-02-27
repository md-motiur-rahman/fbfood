"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ClientAddToQuoteCard from "../components/ClientAddToQuoteCard";

const pageSizeOptions = [12, 24, 48, 96];

type SortKey = "az" | "za";

export default function ItemsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state sync
  const initialCategory = searchParams.get("category") || "all";
  const initialSort = (searchParams.get("sort") as SortKey) || "az";
  const initialPageSize = parseInt(searchParams.get("pageSize") || "12", 10);
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const qRaw = (searchParams.get("q") || "").trim();

  const [category, setCategory] = useState<string>(initialCategory);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [page, setPage] = useState<number>(initialPage);
  const [q, setQ] = useState(qRaw);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const oldParams = params.toString();

    if (category !== "all") params.set("category", category);
    else params.delete("category");
    
    if (sort !== "az") params.set("sort", sort);
    else params.delete("sort");

    if (pageSize !== 12) params.set("pageSize", pageSize.toString());
    else params.delete("pageSize");

    if (page !== 1) params.set("page", page.toString());
    else params.delete("page");

    if (q) params.set("q", q);
    else params.delete("q");

    if (params.toString() !== oldParams) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [category, sort, pageSize, page, q, pathname, router, searchParams]);

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

  // Fetch initial data
  useEffect(() => {
    (async () => {
      try {
        const [resCat, resBrand] = await Promise.all([
          fetch(`/api/admin/categories?page=1&pageSize=1000&sort=name&order=asc`, { cache: "no-store" }),
          fetch(`/api/admin/brands?page=1&pageSize=1000&sort=name&order=asc`, { cache: "no-store" })
        ]);
        
        const dataCat: ListResponse<Category> & { error?: string } = await resCat.json();
        const dataBrand: ListResponse<Brand> & { error?: string } = await resBrand.json();

        if (resCat.ok) setCategories((dataCat.items || []).map((c) => ({ name: c.name, slug: c.slug })));
        if (resBrand.ok) setBrands((dataBrand.items || []).map((b) => ({ name: b.name, slug: b.slug })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Fetch products
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: "1", pageSize: "1000" });
        // We fetch all and filter client side as per original logic, 
        // but ideally this should be server side filtering. 
        // Keeping original logic for now to ensure backend compatibility.
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
  }, []);

  // Filter Logic
  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Search
    if (q) {
      const lowerQ = q.toLowerCase();
      result = result.filter(p => 
        p.productname.toLowerCase().includes(lowerQ) || 
        p.barcode.toLowerCase().includes(lowerQ) ||
        (p.brand && p.brand.toLowerCase().includes(lowerQ)) ||
        (categories.find(c => c.slug === p.category)?.name.toLowerCase().includes(lowerQ))
      );
    }

    // 2. Category
    if (category !== "all") {
      result = result.filter(p => p.category === category);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sort === "az") return a.productname.localeCompare(b.productname);
      return b.productname.localeCompare(a.productname);
    });

    return result;
  }, [items, q, category, sort, categories]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Pagination Logic
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [category, sort, pageSize, q]);

  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  // Loading Skeleton
  const ItemSkeleton = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
      <div className="aspect-square bg-slate-100 rounded-xl w-full" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="h-10 bg-slate-100 rounded-xl w-full mt-4" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-100 sticky top-20 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Products Catalog</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your inventory orders with ease</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-80">
                <input
                  type="search"
                  placeholder="Search by name, brand, or code..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="md:hidden p-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Top Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                {/* Category Filter */}
                <div className="relative w-full sm:w-64">
                   <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer text-sm font-medium"
                   >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                         <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                   </div>
                </div>

                {/* Sort Filter */}
                <div className="relative w-full sm:w-48">
                   <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer text-sm font-medium"
                   >
                      <option value="az">Name (A-Z)</option>
                      <option value="za">Name (Z-A)</option>
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2">
                   <span className="text-sm text-slate-500 whitespace-nowrap hidden sm:inline">Show:</span>
                   <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                      {pageSizeOptions.map((opt) => (
                         <button
                            key={opt}
                            onClick={() => setPageSize(opt)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                               pageSize === opt 
                                  ? 'bg-white text-sky-600 shadow-sm border border-slate-100' 
                                  : 'text-slate-500 hover:text-slate-700'
                            }`}
                         >
                            {opt}
                         </button>
                      ))}
                   </div>
                </div>

                {(category !== "all" || q) && (
                   <button 
                      onClick={() => { setCategory("all"); setQ(""); }}
                      className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                   >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      <span className="hidden sm:inline">Clear</span>
                   </button>
                )}
             </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Found <span className="font-bold text-slate-900">{filteredItems.length}</span> products
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => <ItemSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-medium mb-2">Error loading products</p>
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">Try Again</button>
              </div>
            ) : currentItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {currentItems.map((p) => (
                  <ClientAddToQuoteCard
                    key={p.barcode}
                    id={p.barcode}
                    name={p.productname}
                    img={p.picture}
                    available={p.status === "AVAILABLE"}
                    onDetailsHref={`/items/${p.barcode}`}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4M4 12L10 6M4 12L10 18" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                <button 
                  onClick={() => { setCategory("all"); setQ(""); }}
                  className="mt-6 px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <button
                    onClick={() => goTo(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center px-2 gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p = i + 1;
                      if (totalPages > 5 && page > 3) {
                        p = page - 2 + i;
                        if (p > totalPages) p = totalPages - (4 - i);
                      }
                      
                      return (
                        <button
                          key={p}
                          onClick={() => goTo(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                            page === p
                              ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                              : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => goTo(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
