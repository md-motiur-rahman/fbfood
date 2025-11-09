import Navbar from "@/app/components/Navbar";
import ProductCard from "@/app/components/ProductCard";
import { inventoryProducts, inventoryCategories } from "@/app/data/inventory";
import Image from "next/image";
import Link from "next/link";

export default async function ItemDetailPage({ params }: { params: Promise<{ barcode: string }> }) {
  const { barcode } = await params;
  const product = inventoryProducts.find((p) => p.outerbarcode === barcode);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Item Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            We couldn&apos;t find this item. Go back to {" "}
            <a className="text-amber-700 hover:underline" href="/items">All Items</a>.
          </p>
        </main>
      </div>
    );
  }

  const category = inventoryCategories.find((c) => c.slug === product.category);

  // Similar items from same category (exclude current), sorted by popularity
  const similar = inventoryProducts
    .filter((p) => p.category === product.category && p.outerbarcode !== product.outerbarcode)
    .sort((a, b) => b.itemquery - a.itemquery)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-600">
          <ol className="flex items-center gap-1">
            <li>
              <Link className="hover:underline" href="/">Home</Link>
            </li>
            <li><span className="mx-1 text-zinc-400">/</span></li>
            <li>
              <Link className="hover:underline" href="/items">Items</Link>
            </li>
            {category && (
              <>
                <li><span className="mx-1 text-zinc-400">/</span></li>
                <li>
                  <a className="hover:underline" href={`/categories/${category.slug}`}>{category.name}</a>
                </li>
              </>
            )}
            <li><span className="mx-1 text-zinc-400">/</span></li>
            <li className="text-zinc-900 truncate max-w-[50vw] sm:max-w-none">{product.productname}</li>
          </ol>
        </nav>

        {/* Main content */}
        <section className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Image left */}
          <div className="md:col-span-5 lg:col-span-5">
            <figure className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white shadow-sm">
              <div className="relative aspect-square sm:aspect-4/3">
                <Image
                  src={product.picture}
                  alt={product.productname}
                  layout='fill'
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent" />
              </div>
            </figure>
          </div>

          {/* Details right */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="flex items-center gap-2">
              {category && (
                <a href={`/categories/${category.slug}`} className="inline-flex items-center rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                  {category.name}
                </a>
              )}
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">Popularity: {product.itemquery}</span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{product.productname}</h1>

            {/* Key facts */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl ring-1 ring-black/5 bg-white p-3">
                <div className="text-xs text-zinc-500">Barcode</div>
                <div className="mt-1 text-sm font-semibold text-zinc-800 break-all">{product.outerbarcode}</div>
              </div>
              <div className="rounded-xl ring-1 ring-black/5 bg-white p-3">
                <div className="text-xs text-zinc-500">Case size</div>
                <div className="mt-1 text-sm font-semibold text-zinc-800">{product.caseSize}</div>
              </div>
              <div className="rounded-xl ring-1 ring-black/5 bg-white p-3">
                <div className="text-xs text-zinc-500">Pallet size</div>
                <div className="mt-1 text-sm font-semibold text-zinc-800">{product.palletSize}</div>
              </div>
            </div>

            {/* Policy / actions */}
            <div className="mt-5 grid gap-3 text-sm text-zinc-700">
              <div className="rounded-xl ring-1 ring-black/5 bg-white p-4">
                Pricing is confirmed based on order quantity (MOQs, tiered discounts). Request a quote with your required SKUs, quantities and frequency.
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <a href="/contact" className="inline-flex w-full sm:w-auto h-11 items-center justify-center rounded-full bg-amber-500 px-6 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
                  Get a Wholesale Quote
                </a>
                {category && (
                  <a href={`/categories/${category.slug}`} className="inline-flex w-full sm:w-auto h-11 items-center justify-center rounded-full border border-black/10 px-6 text-sm font-semibold hover:bg-zinc-50">
                    View more in {category.name}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Similar items */}
        <section className="mt-10 pt-6 border-t border-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Similar items</h2>
            {category && (
              <a href={`/categories/${category.slug}`} className="text-sm font-medium text-amber-700 hover:underline">View all</a>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard
                key={p.outerbarcode}
                id={p.outerbarcode}
                name={p.productname}
                img={p.picture}
                onDetailsHref={`/items/${p.outerbarcode}`}
              />
            ))}
            {similar.length === 0 && (
              <div className="col-span-full text-sm text-zinc-600">No similar items found.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
