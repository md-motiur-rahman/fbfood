"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Slide = {
  id: number;
  title: string | null;
  subtitle: string | null;
  img: string;
  href: string;
  sort_order: number;
  is_active: 0 | 1;
  created_at: string;
};

type ListResponse = {
  items: Slide[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

const HREF_OPTIONS = [
  { value: "/categories", label: "Categories" },
  { value: "/brands", label: "Brands" },
  { value: "/items", label: "All Items" },
  { value: "/whats-new", label: "What’s New" },
  { value: "/top-selling", label: "Top Sellings" },
  { value: "/promotion/monthly", label: "Monthly Promotion" },
  { value: "/promotion/seasonal", label: "Seasonal Promotion" },
];

export default function AdminCarouselPage() {
  const [items, setItems] = useState<Slide[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ field: string; order: "asc" | "desc" }>({ field: "sort_order", order: "asc" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    img: "",
    href: "/whats-new",
    sort_order: 0,
    is_active: 1 as 0 | 1,
  });

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
      const res = await fetch(`/api/admin/carousel?${params.toString()}`, { cache: "no-store" });
      const data: ListResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, sort]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleSort(field: string) {
    setSort((s) => (s.field === field ? { field, order: s.order === "asc" ? "desc" : "asc" } : { field, order: "asc" }));
  }

  async function onUploadImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/admin/carousel/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    setForm((s) => ({ ...s, img: data.path }));
  }

  async function onCreate() {
    try {
      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setModalOpen(false);
      setForm({ title: "", subtitle: "", img: "", href: "/whats-new", sort_order: 0, is_active: 1 });
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Create failed";
      alert(msg);
    }
  }

  async function onEditStart(slide: Slide) {
    setEditing(slide);
    setForm({ title: slide.title || "", subtitle: slide.subtitle || "", img: slide.img, href: slide.href, sort_order: slide.sort_order, is_active: slide.is_active });
    setEditModalOpen(true);
  }

  async function onUpdate() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/carousel/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setEditModalOpen(false);
      setEditing(null);
      setForm({ title: "", subtitle: "", img: "", href: "/whats-new", sort_order: 0, is_active: 1 });
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Update failed";
      alert(msg);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this slide?")) return;
    try {
      const res = await fetch(`/api/admin/carousel/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      alert(msg);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">Carousel Slides</h1>
          <button onClick={() => setModalOpen(true)} className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
            Add Slide
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Search title, subtitle, href"
            className="w-72 rounded border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
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
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("sort_order")}>
                  Order
                </th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("title")}>Title</th>
                <th className="px-3 py-2">Link</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("is_active")}>Active</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("created_at")}>Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-zinc-600">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-red-700">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-zinc-600">No slides found</td></tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-t border-amber-100 hover:bg-amber-50/50">
                    <td className="px-3 py-2 font-mono text-xs">{s.sort_order}</td>
                    <td className="px-3 py-2">{s.img ? <Image src={s.img} alt={s.title || "slide"} width={64} height={40} className="h-10 w-16 object-cover rounded" /> : <span className="text-zinc-500">—</span>}</td>
                    <td className="px-3 py-2">{s.title || <span className="text-zinc-500">—</span>}</td>
                    <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]">{s.href}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-zinc-200 text-zinc-800'}`}>
                        {s.is_active ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEditStart(s)} className="rounded border border-amber-200 px-2 py-1 text-xs hover:bg-amber-50">Edit</button>
                        <button onClick={() => onDelete(s.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
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

      {/* Add Slide Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-amber-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Add Slide</h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-600 hover:text-zinc-900">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">Title<input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2"/></label>
              <label className="text-sm">Subtitle<input value={form.subtitle} onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2"/></label>
              <label className="text-sm">Link (page)
                <select value={form.href} onChange={(e) => setForm((s) => ({ ...s, href: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2">
                  {HREF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="text-sm">Sort Order<input type="number" value={form.sort_order} onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2"/></label>
              <label className="text-sm">Image
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) { try { await onUploadImage(f); } catch (err) { const msg = err instanceof Error ? err.message : "Upload failed"; alert(msg); } }
                }} className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
              </label>
              <label className="text-sm">Active
                <select value={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: Number(e.target.value) as 0 | 1 }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2">
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded border border-amber-200 px-3 py-2 text-sm">Cancel</button>
              <button onClick={onCreate} className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slide Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-amber-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Edit Slide</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-zinc-600 hover:text-zinc-900">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">Title<input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2"/></label>
              <label className="text-sm">Subtitle<input value={form.subtitle} onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2"/></label>
              <label className="text-sm">Link (page)
                <select value={form.href} onChange={(e) => setForm((s) => ({ ...s, href: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2">
                  {HREF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="text-sm">Sort Order<input type="number" value={form.sort_order} onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2"/></label>
              <label className="text-sm">Image
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) { try { await onUploadImage(f); } catch (err) { const msg = err instanceof Error ? err.message : "Upload failed"; alert(msg); } }
                }} className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
              </label>
              <label className="text-sm">Active
                <select value={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: Number(e.target.value) as 0 | 1 }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2">
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setEditModalOpen(false)} className="rounded border border-amber-200 px-3 py-2 text-sm">Cancel</button>
              <button onClick={onUpdate} className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
