"use client";

import React, { useMemo, useState } from "react";
import { useQuote } from "../components/quote/QuoteContext";
import Navbar from "../components/Navbar";

export default function QuotePage() {
  const { items, totalCount, updateQuantity, removeItem, clear } = useQuote();
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  });

  const disabled = useMemo(() => submitting || items.length === 0 || !form.name.trim() || !form.email.trim(), [submitting, items.length, form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
        items: items.map((it) => ({ barcode: it.barcode, quantity: it.quantity })),
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = (data as any)?.error || "Submission failed";
        setError(message);
        return;
      }

      // Only on successful submission do we show success and clear the quote
      setSuccessId((data as any)?.id ?? Date.now());
      clear();
      setForm({ name: "", email: "", company: "", phone: "", notes: "" });
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Request a Quote</h1>
          <p className="mt-2 text-sm text-zinc-600">Review your items, adjust quantities, and provide your contact details. We will reach out with pricing and freight details.</p>
        </header>

        {successId ? (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 mb-8">
            <div className="font-semibold">Quote submitted!</div>
            <div className="text-sm">Your quote request (ID #{successId}) has been received. A confirmation will be sent to your email.</div>
          </div>
        ) : null}

        {/* Items */}
        <section className="rounded-lg border border-amber-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
            <div className="text-sm font-semibold">Items ({totalCount})</div>
            {items.length > 0 && (
              <button onClick={clear} className="text-sm text-red-700 hover:underline">Clear all</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-amber-50 text-zinc-700">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Barcode</th>
                  <th className="px-3 py-2 text-left">Quantity</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-zinc-600">Your quote is empty. Browse products and add items to quote.</td></tr>
                ) : (
                  items.map((it, index) => (
                    <tr key={`${it.barcode}-${index}`} className="border-t border-amber-100">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          {it.picture ? (<img src={it.picture} alt={it.productname} className="h-10 w-10 rounded object-cover" />) : (<div className="h-10 w-10 rounded bg-zinc-100" />)}
                          <div className="font-medium line-clamp-2">
                            {it.productname}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{it.barcode}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateQuantity(it.barcode, Number(e.target.value))}
                          className="w-24 rounded border border-amber-200 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeItem(it.barcode)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Remove</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Submission form */}
        <section className="mt-6 rounded-lg border border-amber-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Contact details</h2>
          {error ? <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">Name
              <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
            </label>
            <label className="text-sm">Email
              <input value={form.email} type="email" onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
            </label>
            <label className="text-sm">Company
              <input value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
            </label>
            <label className="text-sm">Phone
              <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
            </label>
            <label className="text-sm sm:col-span-2">Notes
              <textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} rows={4} className="mt-1 w-full rounded border border-amber-200 px-3 py-2" />
            </label>
            <div className="sm:col-span-2 flex items-center justify-end gap-2">
              <button type="button" onClick={clear} disabled={items.length === 0} className="rounded border border-amber-200 px-3 py-2 text-sm disabled:opacity-50">Clear</button>
              <button type="submit" disabled={disabled} className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Quote"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
