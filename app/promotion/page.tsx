import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { inventoryProducts } from "../data/inventory";

export default function PromotionPage() {
  // Pick top 12 by itemquery to simulate promotions; in real use, flag from CMS/API
  const promos = [...inventoryProducts].sort((a, b) => b.itemquery - a.itemquery).slice(0, 12);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Promotion</h1>
            <p className="mt-1 text-sm text-zinc-600">Featured deals and highlighted products for quick stocking.</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {promos.map((p) => (
            <ProductCard
              key={p.outerbarcode}
              id={p.outerbarcode}
              name={p.productname}
              img={p.picture}
              onDetailsHref={`/items/${p.outerbarcode}`}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
