import Navbar from "../components/Navbar";

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">FAQ's</h1>
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
      </main>
    </div>
  );
}
