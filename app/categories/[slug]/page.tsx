import Navbar from "@/app/components/Navbar";
import ProductCard from "@/app/components/ProductCard";
import { inventoryCategories, inventoryProducts } from "@/app/data/inventory";
import Image from "next/image";

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = decodeURIComponent(slug).toLowerCase();
  const category = inventoryCategories.find((c) => c.slug.toLowerCase() === normalized);
  const items = inventoryProducts.filter((p) => p.category.toLowerCase() === normalized);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {!category ? (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Category Not Found</h1>
            <p className="mt-2 text-sm text-zinc-600">We couldn\&apos;t find this category. Go back to <a className="text-amber-700 hover:underline" href="/categories">Categories</a>.</p>
          </div>
        ) : (
          <>
            <figure className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white shadow-sm">
              <div className="relative aspect-[3/2] sm:aspect-[16/6]">
                <Image src={category.picture} alt={category.name} fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">{category.name}</h1>
                  <p className="mt-2 text-xs sm:text-sm text-white/90 drop-shadow">{items.length} items • Pricing confirmed based on order quantity</p>
                </figcaption>
              </div>
            </figure>
            <div className="mt-3 flex items-center gap-2">
              <a href="/categories" className="inline-flex h-9 items-center rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-zinc-50">Back to Categories</a>
              <a href="/contact" className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">Get a Quote</a>
            </div>

            <section className="mt-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {items.length === 0 ? (
                  <div className="col-span-full text-sm text-zinc-600">No products available in this category yet.</div>
                ) : (
                  items.map((p, idx) => (
                    <ProductCard key={`${p.productname}-${idx}`} id={p.outerbarcode} name={p.productname} img={p.picture} onDetailsHref={`/items/${p.outerbarcode}`} />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
