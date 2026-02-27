"use client";

import React, { useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  picture: string;
  created_at: string;
};

type ListResponse = {
  items: Category[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ field: string; order: "asc" | "desc" }>({ field: "created_at", order: "desc" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<null | { processed: number; inserted: number; skipped: number; errors: { row: number; error: string }[] }>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    picture: "",
    picture_key: "",
    mime_type: "",
    size_bytes: 0,
    width: 0,
    height: 0,
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
      const res = await fetch(`/api/admin/categories?${params.toString()}`, { cache: "no-store" });
      const data: ListResponse = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || "Failed to load");
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e: any) {
      setError(e.message || "Failed to load");
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
    const res = await fetch("/api/admin/categories/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    setForm((s) => ({
      ...s,
      picture: data.path,
      picture_key: data.key,
      mime_type: data.mime_type || "",
      size_bytes: data.size_bytes || 0,
      width: data.width || 0,
      height: data.height || 0,
    }));
  }

  async function onCreate() {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setModalOpen(false);
      setForm({ name: "", slug: "", picture: "", picture_key: "", mime_type: "", size_bytes: 0, width: 0, height: 0 });
      fetchData();
    } catch (e: any) {
      alert(e.message || "Create failed");
    }
  }

  async function onEditStart(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, picture: cat.picture, picture_key: cat.picture, mime_type: "", size_bytes: 0, width: 0, height: 0 });
    setEditModalOpen(true);
  }

  async function onUpdate() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setEditModalOpen(false);
      setEditing(null);
      setForm({ name: "", slug: "", picture: "", picture_key: "", mime_type: "", size_bytes: 0, width: 0, height: 0 });
      fetchData();
    } catch (e: any) {
      alert(e.message || "Update failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      fetchData();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">Categories</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setBulkOpen(true)} className="inline-flex h-9 items-center rounded-full bg-sky-200 px-4 text-sm font-semibold text-slate-900 shadow hover:bg-sky-100">Bulk Upload CSV</button>
            <button onClick={() => setModalOpen(true)} className="inline-flex h-9 items-center rounded-full bg-sky-500 px-4 text-sm font-semibold text-slate-900 shadow hover:bg-sky-400">
              Add Category
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Search name or slug"
            className="w-72 rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
          />
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Rows per page</span>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="rounded border border-sky-200 px-2 py-1 outline-none">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-auto rounded border border-sky-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-50">
              <tr className="text-left">
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("name")}>Name</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("slug")}>Slug</th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => toggleSort("created_at")}>Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-600">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-red-700">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-600">No categories found</td></tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-t border-sky-100 hover:bg-sky-50/50">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.slug}</td>
                    <td className="px-3 py-2">{c.picture ? <img src={c.picture} alt={c.name} className="h-10 w-10 object-cover rounded" /> : <span className="text-slate-500">—</span>}</td>
                    <td className="px-3 py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEditStart(c)} className="rounded border border-sky-200 px-2 py-1 text-xs hover:bg-sky-50">Edit</button>
                        <button onClick={() => onDelete(c.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
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
            <button disabled={page <= 1} onClick={() => setPage(1)} className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50">« First</button>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50">‹ Prev</button>
            <span>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50">Next ›</button>
            <button disabled={page >= pages} onClick={() => setPage(pages)} className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50">Last »</button>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Add Category</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-600 hover:text-slate-900">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">Name<input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="mt-1 w-full rounded border border-sky-200 px-3 py-2"/></label>
              <label className="text-sm">Slug<input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} className="mt-1 w-full rounded border border-sky-200 px-3 py-2"/></label>
              <label className="text-sm">Picture
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    try { await onUploadImage(f); } catch (err: any) { alert(err.message || "Upload failed"); }
                  }
                }} className="mt-1 w-full rounded border border-sky-200 px-3 py-2" />
              </label>
              <div className="text-xs text-slate-600 col-span-full">
                {form.picture ? (<div className="flex items-center gap-2"><img src={form.picture} alt="preview" className="h-10 w-10 object-cover rounded"/><span className="truncate">{form.picture}</span></div>) : "No image uploaded yet."}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded border border-sky-200 px-3 py-2 text-sm">Cancel</button>
              <button onClick={onCreate} className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Edit Category</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-600 hover:text-slate-900">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">Name<input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="mt-1 w-full rounded border border-sky-200 px-3 py-2"/></label>
              <label className="text-sm">Slug<input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} className="mt-1 w-full rounded border border-sky-200 px-3 py-2"/></label>
              <label className="text-sm">Picture
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    try { await onUploadImage(f); } catch (err: any) { alert(err.message || "Upload failed"); }
                  }
                }} className="mt-1 w-full rounded border border-sky-200 px-3 py-2" />
              </label>
              <div className="text-xs text-slate-600 col-span-full">
                {form.picture ? (<div className="flex items-center gap-2"><img src={form.picture} alt="preview" className="h-10 w-10 object-cover rounded"/><span className="truncate">{form.picture}</span></div>) : "No image uploaded yet."}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setEditModalOpen(false)} className="rounded border border-sky-200 px-3 py-2 text-sm">Cancel</button>
              <button onClick={onUpdate} className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400">Save</button>
            </div>
          </div>
        </div>
      )}
    {/* Bulk Upload Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Bulk Upload Categories (CSV)</h2>
              <button onClick={() => setBulkOpen(false)} className="text-slate-600 hover:text-slate-900">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-2">Upload a CSV with the following headers:</p>
                <pre className="whitespace-pre-wrap rounded border border-sky-200 bg-sky-50 p-2 text-xs">name,picture</pre>
                <p className="mt-2 text-slate-600">Required: name, picture. Picture must be an http(s) URL, a data URI (data:image/...;base64,...), or a path under /public. Slug is generated automatically from name.</p>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const csvInput = (e.currentTarget.elements.namedItem("file") as HTMLInputElement) || null;
                const f = csvInput?.files?.[0];
                if (!f) { alert("Please choose a CSV file"); return; }
                setBulkUploading(true);
                setBulkResult(null);
                try {
                  const fd = new FormData();
                  fd.append("file", f);
                  const res = await fetch("/api/admin/categories/bulk", { method: "POST", body: fd });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || "Upload failed");
                  setBulkResult({ processed: data.processed, inserted: data.inserted, skipped: data.skipped, errors: data.errors || [] });
                  fetchData();
                } catch (err: any) {
                  alert(err.message || "Bulk upload failed");
                } finally {
                  setBulkUploading(false);
                }
              }} className="space-y-3">
                <label className="block text-sm">CSV file
                  <input type="file" name="file" accept=".csv,text/csv" className="mt-1 w-full rounded border border-sky-200 px-3 py-2" />
                </label>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setBulkOpen(false)} className="rounded border border-sky-200 px-3 py-2 text-sm">Cancel</button>
                  <button type="submit" disabled={bulkUploading} className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-50">{bulkUploading ? "Uploading..." : "Upload"}</button>
                </div>
              </form>
              {bulkResult && (
                <div className="mt-3 rounded border border-sky-200 bg-sky-50 p-3 text-xs">
                  <div>Processed: {bulkResult.processed}</div>
                  <div>Inserted: {bulkResult.inserted}</div>
                  <div>Skipped: {bulkResult.skipped}</div>
                  {bulkResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Errors ({bulkResult.errors.length})</summary>
                      <ul className="mt-2 list-disc pl-5">
                        {bulkResult.errors.slice(0, 50).map((e, i) => (
                          <li key={i}>Row {e.row}: {e.error}</li>
                        ))}
                        {bulkResult.errors.length > 50 && <li>...and {bulkResult.errors.length - 50} more</li>}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
