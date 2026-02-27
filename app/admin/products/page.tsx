/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Product = {
  id: number;
  productname: string;
  category: string;
  brand?: string | null;
  barcode: string;
  caseSize: string;
  palletQty: number | null;
  picture: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  promotion_type?: "MONTHLY" | "SEASONAL" | null;
  is_top_selling?: boolean | number;
  created_at: string;
};

type ListResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

type CategoryOption = { id: number; name: string; slug: string };
type BrandOption = { id: number; name: string; slug: string };

const PAGE_SIZES = [10, 25, 50, 100];

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "created_at",
    order: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<null | {
    processed: number;
    inserted: number;
    skipped: number;
    errors: { row: number; error: string }[];
  }>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    productname: "",
    category: "",
    brand: "",
    barcode: "",
    caseSize: "",
    palletQty : 0,
    picture: "",
    picture_key: "",
    mime_type: "",
    size_bytes: 0,
    width: 0,
    height: 0,
    status: "AVAILABLE" as const,
    promotion_type: "" as "" | "MONTHLY" | "SEASONAL",
    itemquery: 1,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

  const fetchData = useMemo(
    () => async () => {
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
        const res = await fetch(`/api/admin/products?${params.toString()}`, {
          cache: "no-store",
        });
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
    },
    [page, pageSize, q, sort]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    (async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const params = new URLSearchParams({
          page: String(1),
          pageSize: String(1000),
          sort: "name",
          order: "asc",
        });
        const res = await fetch(`/api/admin/categories?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load categories");
        setCategories(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        setCatError(e.message || "Failed to load categories");
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setBrandLoading(true);
      setBrandError(null);
      try {
        const params = new URLSearchParams({
          page: String(1),
          pageSize: String(1000),
          sort: "name",
          order: "asc",
        });
        const res = await fetch(`/api/admin/brands?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load brands");
        setBrands(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        setBrandError(e.message || "Failed to load brands");
      } finally {
        setBrandLoading(false);
      }
    })();
  }, []);

  function toggleSort(field: string) {
    setSort((s) =>
      s.field === field
        ? { field, order: s.order === "asc" ? "desc" : "asc" }
        : { field, order: "asc" }
    );
  }

  const allSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }
  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleTopSelling(product: Product) {
    try {
      const newVal = !product.is_top_selling;
      // Optimistic update
      setItems((prev) => prev.map((p) => p.id === product.id ? { ...p, is_top_selling: newVal } : p));
      
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, is_top_selling: newVal }),
      });
      
      if (!res.ok) {
        // Revert
        setItems((prev) => prev.map((p) => p.id === product.id ? { ...p, is_top_selling: !newVal } : p));
        const data = await res.json();
        throw new Error(data?.error || "Update failed");
      }
    } catch (e: any) {
      alert(e.message || "Update failed");
    }
  }

  async function applyBulkStatus(status: "AVAILABLE" | "UNAVAILABLE") {
    if (selected.size === 0) {
      alert("No products selected");
      return;
    }
    const ids = Array.from(selected.values());
    try {
      const res = await fetch("/api/admin/products/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Bulk status update failed");
      setSelected(new Set());
      fetchData();
    } catch (e: any) {
      alert(e.message || "Bulk status update failed");
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) {
      alert("No products selected");
      return;
    }
    if (
      !confirm(
        `Delete ${selected.size} selected product(s)? This cannot be undone.`
      )
    )
      return;
    const ids = Array.from(selected.values());
    try {
      const res = await fetch("/api/admin/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Bulk delete failed");
      setSelected(new Set());
      fetchData();
    } catch (e: any) {
      alert(e.message || "Bulk delete failed");
    }
  }

  async function onUploadImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/admin/products/upload", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    setNewProduct((s) => ({
      ...s,
      picture: data.path,
      picture_key: data.key,
      mime_type: data.mime_type || "",
      size_bytes: data.size_bytes || 0,
      width: data.width || 0,
      height: data.height || 0,
    }));
  }

  async function onCreateProduct() {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setModalOpen(false);
      setNewProduct({
        productname: "",
        category: "",
        brand: "",
        barcode: "",
        caseSize: "",
        palletQty : 0,
        picture: "",
        picture_key: "",
        mime_type: "",
        size_bytes: 0,
        width: 0,
        height: 0,
        status: "AVAILABLE",
        promotion_type: "",
        itemquery: 1,
      });
      fetchData();
    } catch (e: any) {
      alert(e.message || "Create failed");
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">Products</h1>
          <div className="flex items-center gap-2">
            <button
              disabled={selected.size === 0}
              onClick={() => applyBulkStatus("AVAILABLE")}
              className="inline-flex h-9 items-center rounded-full border border-green-300 bg-green-50 px-4 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              Set Available ({selected.size})
            </button>
            <button
              disabled={selected.size === 0}
              onClick={() => applyBulkStatus("UNAVAILABLE")}
              className="inline-flex h-9 items-center rounded-full border border-sky-300 bg-sky-50 px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
            >
              Set Unavailable
            </button>
            <button
              disabled={selected.size === 0}
              onClick={bulkDelete}
              className="inline-flex h-9 items-center rounded-full border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setBulkOpen(true)}
              className="inline-flex h-9 items-center rounded-full bg-sky-200 px-4 text-sm font-semibold text-slate-900 shadow hover:bg-sky-100"
            >
              Bulk Upload CSV
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex h-9 items-center rounded-full bg-sky-500 px-4 text-sm font-semibold text-slate-900 shadow hover:bg-sky-400"
            >
              Add Product
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search product, barcode, category"
            className="w-72 rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
          />
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="rounded border border-sky-200 px-2 py-1 outline-none"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto rounded border border-sky-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-50">
              <tr className="text-left">
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("productname")}
                >
                  Name
                </th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("category")}
                >
                  Category
                </th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("barcode")}
                >
                  Barcode
                </th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("caseSize")}
                >
                  Case
                </th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("palletQty ")}
                >
                  Pallet
                </th>
                <th className="px-3 py-2">Image</th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("status")}
                >
                  Status
                </th>
                <th className="px-3 py-2">Top Selling</th>
                <th
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => toggleSort("created_at")}
                >
                  Created
                </th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-6 text-center text-slate-600"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-6 text-center text-red-700"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-6 text-center text-slate-600"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-sky-100 hover:bg-sky-50/50"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.productname}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{p.productname}</td>
                    <td className="px-3 py-2">{p.category}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {p.barcode}
                    </td>
                    <td className="px-3 py-2">{p.caseSize}</td>
                    <td className="px-3 py-2">{p.palletQty }</td>
                    <td className="px-3 py-2">
                      {p.picture ? (
                        <Image
                          src={p.picture}
                          alt={p.productname}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover rounded"
                          unoptimized={p.picture.startsWith("http")}
                        />
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleTopSelling(p)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                          p.is_top_selling ? 'bg-sky-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            p.is_top_selling ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setEditOpen(true);
                          }}
                          className="rounded border border-sky-200 px-2 py-1 text-xs hover:bg-sky-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this product?")) return;
                            try {
                              const res = await fetch(
                                `/api/admin/products/${p.id}`,
                                { method: "DELETE" }
                              );
                              const data = await res.json();
                              if (!res.ok)
                                throw new Error(data?.error || "Delete failed");
                              fetchData();
                            } catch (e: any) {
                              alert(e.message || "Delete failed");
                            }
                          }}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
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
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50"
            >
              « First
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50"
            >
              ‹ Prev
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50"
            >
              Next ›
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage(pages)}
              className="rounded border border-sky-200 px-2 py-1 disabled:opacity-50"
            >
              Last »
            </button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Add Product</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">
                Name
                <input
                  value={newProduct.productname}
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      productname: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Category
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct((s) => ({ ...s, category: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="" disabled>
                    {catLoading ? "Loading..." : "Select a category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {catError && (
                  <div className="mt-1 text-xs text-red-600">{catError}</div>
                )}
              </label>
              <label className="text-sm">
                Brand
                <select
                  value={newProduct.brand}
                  onChange={(e) =>
                    setNewProduct((s) => ({ ...s, brand: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="" disabled>
                    {brandLoading ? "Loading..." : "Select a brand"}
                  </option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {brandError && (
                  <div className="mt-1 text-xs text-red-600">{brandError}</div>
                )}
              </label>
              <label className="text-sm">
                Barcode
                <input
                  value={newProduct.barcode}
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      barcode: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Case Size
                <input
                  type="number"
                  value={newProduct.caseSize}
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      caseSize: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Pallet Size
                <input
                  type="number"
                  value={newProduct.palletQty }
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      palletQty : Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      try {
                        await onUploadImage(f);
                      } catch (err: any) {
                        alert(err.message || "Upload failed");
                      }
                    }
                  }}
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <div className="text-xs text-slate-600 col-span-full">
                {newProduct.picture ? (
                  <div className="flex items-center gap-2">
                    <Image
                      src={newProduct.picture}
                      alt="preview"
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover rounded"
                    />
                    <span className="truncate">{newProduct.picture}</span>
                  </div>
                ) : (
                  "No image uploaded yet."
                )}
              </div>
              <label className="text-sm">
                Status
                <select
                  value={newProduct.status}
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      status: e.target.value as any,
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </label>
              <label className="text-sm">
                Promotion Type
                <select
                  value={newProduct.promotion_type}
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      promotion_type: e.target.value as any,
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="">None</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="SEASONAL">SEASONAL</option>
                </select>
              </label>
              <label className="text-sm">
                Item Query
                <input
                  type="number"
                  value={newProduct.itemquery}
                  onChange={(e) =>
                    setNewProduct((s) => ({
                      ...s,
                      itemquery: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded border border-sky-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onCreateProduct}
                className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Edit Product</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">
                Name
                <input
                  value={editing.productname}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, productname: e.target.value } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Category
                <select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, category: e.target.value } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="" disabled>
                    {catLoading ? "Loading..." : "Select a category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Brand
                <select
                  value={editing.brand || ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, brand: e.target.value } : s))
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="" disabled>
                    {brandLoading ? "Loading..." : "Select a brand"}
                  </option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Barcode
                <input
                  value={editing.barcode}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, barcode: e.target.value } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Case Size
                <input
                  type="number"
                  value={editing.caseSize}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, caseSize: e.target.value } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Pallet Size
                <input
                  type="number"
                  value={editing.palletQty ?? ""}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, palletQty: e.target.value ? Number(e.target.value) : null } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Picture
                <input
                  type="text"
                  value={editing.picture}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, picture: e.target.value } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Status
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, status: e.target.value as any } : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </label>
              <label className="text-sm">
                Promotion Type
                <select
                  value={editing.promotion_type || ""}
                  onChange={(e) =>
                    setEditing((s) =>
                      s
                        ? {
                            ...s,
                            promotion_type: (e.target.value ||
                              undefined) as any,
                          }
                        : s
                    )
                  }
                  className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                >
                  <option value="">None</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="SEASONAL">SEASONAL</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded border border-sky-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editing) return;
                  try {
                    const res = await fetch(
                      `/api/admin/products/${editing.id}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(editing),
                      }
                    );
                    const data = await res.json();
                    if (!res.ok)
                      throw new Error(data?.error || "Update failed");
                    setEditOpen(false);
                    setEditing(null);
                    fetchData();
                  } catch (e: any) {
                    alert(e.message || "Update failed");
                  }
                }}
                className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                Bulk Upload Products (CSV)
              </h2>
              <button
                onClick={() => setBulkOpen(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-2">
                  Upload a CSV with the following headers (lowercase):
                </p>
                <pre className="whitespace-pre-wrap rounded border border-sky-200 bg-sky-50 p-2 text-xs">
                  productname,brand,category,picture,casesize,
                  barcode,palletqty,layerqty,status,itemquery,gross_weight,volume
                </pre>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold">Required:</span> productname
                  (product name), brand (brand slug), category (category slug),
                  picture (image URL/path), casesize (pack size), barcode
                  (barcode), palletqty (pallet quantity), layerqty (layer
                  quantity).
                  <span className="font-semibold ml-1">Optional:</span> status
                  (AVAILABLE|UNAVAILABLE), itemquery (number), gross_weight (number), volume (number). Picture must be
                  an http(s) URL, a data URI, or a path under /public.
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const csvInput =
                    (e.currentTarget.elements.namedItem(
                      "file"
                    ) as HTMLInputElement) || null;
                  const f = csvInput?.files?.[0];
                  if (!f) {
                    alert("Please choose a CSV file");
                    return;
                  }
                  setBulkUploading(true);
                  setBulkResult(null);
                  try {
                    const fd = new FormData();
                    fd.append("file", f);
                    const res = await fetch("/api/admin/products/bulk", {
                      method: "POST",
                      body: fd,
                    });
                    const data = await res.json();
                    if (!res.ok)
                      throw new Error(data?.error || "Upload failed");
                    setBulkResult({
                      processed: data.processed,
                      inserted: data.inserted,
                      skipped: data.skipped,
                      errors: data.errors || [],
                    });
                    fetchData();
                  } catch (err: any) {
                    alert(err.message || "Bulk upload failed");
                  } finally {
                    setBulkUploading(false);
                  }
                }}
                className="space-y-3"
              >
                <label className="block text-sm">
                  CSV file
                  <input
                    type="file"
                    name="file"
                    accept=".csv,text/csv"
                    className="mt-1 w-full rounded border border-sky-200 px-3 py-2"
                  />
                </label>
                <p className="text-xs text-slate-600">
                  The picture column must contain a valid http(s) URL, a data
                  URI, or a path under /public (e.g., /images/img.jpg). Images
                  will be downloaded/saved to /uploads/products automatically.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkOpen(false)}
                    className="rounded border border-sky-200 px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkUploading}
                    className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-50"
                  >
                    {bulkUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
              {bulkResult && (
                <div className="mt-3 rounded border border-sky-200 bg-sky-50 p-3 text-xs">
                  <div>Processed: {bulkResult.processed}</div>
                  <div>Inserted: {bulkResult.inserted}</div>
                  <div>Skipped: {bulkResult.skipped}</div>
                  {bulkResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">
                        Errors ({bulkResult.errors.length})
                      </summary>
                      <ul className="mt-2 list-disc pl-5">
                        {bulkResult.errors.slice(0, 50).map((e, i) => (
                          <li key={i}>
                            Row {e.row}: {e.error}
                          </li>
                        ))}
                        {bulkResult.errors.length > 50 && (
                          <li>...and {bulkResult.errors.length - 50} more</li>
                        )}
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
