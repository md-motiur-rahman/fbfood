"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

type ProductRow = {
  id: number;
  productname: string;
  category: string;
  brand?: string | null;
  barcode: string;
  picture: string;
  promotion_type?: "MONTHLY" | "SEASONAL" | null;
  created_at: string;
};

type ListResponse = {
  items: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

export default function AdminPromotionPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ field: string; order: "asc" | "desc" }>({ field: "created_at", order: "desc" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [promType, setPromType] = useState<"" | "MONTHLY" | "SEASONAL">("");

  const fetchData = useMemo(() => async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: sort.field,
        order: sort.order,
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store" });
      const data: ListResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setItems(data.items as ProductRow[]);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, sort]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyPromotion() {
    if (selected.size === 0) { alert("No products selected"); return; }
    const ids = Array.from(selected.values());
    try {
      const res = await fetch("/api/admin/products/promotion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, promotion_type: promType || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setApplyOpen(false);
      setSelected(new Set());
      setPromType("");
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  }

  function toggleSort(field: string) {
    setSort((s) => (s.field === field ? { field, order: s.order === "asc" ? "desc" : "asc" } : { field, order: "asc" }));
  }

  return (
    <div className="min-h-screen bg-amber-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">Promotions</h1>
          <button disabled={selected.size === 0} onClick={() => setApplyOpen(true)} className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400 disabled:opacity-50">
            Apply to {selected.size} selected
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Search product, barcode, category, brand"
            className="w-80 rounded border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Rows per page</span>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="rounded border border-amber-200 px-2 py-1 outline-none">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-auto rounded border border-amber-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-amber-50">
              <tr className="text-left">
                <th className="px-3 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all"/></th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("productname")}>Name</th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("category")}>Category</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("brand")}>Brand</th>
                <th className="px-3 py-2">Barcode</th>
                <th className="px-3 py-2">Promotion</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("created_at")}>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-600">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-red-700">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-600">No products found</td></tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="border-t border-amber-100 hover:bg-amber-50/50">
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.productname}`}/></td>
                    <td className="px-3 py-2 font-medium">{p.productname}</td>
                    <td className="px-3 py-2">{p.picture ? <Image src={p.picture} alt={p.productname} width={36} height={36} className="h-9 w-9 object-cover rounded" /> : <span className="text-zinc-500">—</span>}</td>
                    <td className="px-3 py-2">{p.category}</td>
                    <td className="px-3 py-2">{p.brand || <span className="text-zinc-500">—</span>}</td>
                    <td className="px-3 py-2 font-mono text-xs">{p.barcode}</td>
                    <td className="px-3 py-2">{p.promotion_type || <span className="text-zinc-500">None</span>}</td>
                    <td className="px-3 py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            Showing {items.length} of {total} items
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(1)} className="rounded border border-amber-200 px-2 py-1 disabled:opacity-50">« First</button>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-amber-200 px-2 py-1 disabled:opacity-50">‹ Prev</button>
            <span>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="rounded border border-amber-200 px-2 py-1 disabled:opacity-50">Next ›</button>
            <button disabled={page >= pages} onClick={() => setPage(pages)} className="rounded border border-amber-200 px-2 py-1 disabled:opacity-50">Last »</button>
          </div>
        </div>
      </div>

      {/* Apply Promotion Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Apply Promotion</h2>
              <button onClick={() => setApplyOpen(false)} className="text-zinc-600 hover:text-zinc-900">✕</button>
            </div>
            <div className="grid gap-3">
              <label className="text-sm">Promotion Type
                <select value={promType} onChange={(e) => setPromType(e.target.value as "" | "MONTHLY" | "SEASONAL")} className="mt-1 w-full rounded border border-amber-200 px-3 py-2">
                  <option value="">None (clear)</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="SEASONAL">SEASONAL</option>
                </select>
              </label>
              <div className="text-xs text-zinc-600">This will update {selected.size} product(s).</div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setApplyOpen(false)} className="rounded border border-amber-200 px-3 py-2 text-sm">Cancel</button>
              <button onClick={applyPromotion} className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
