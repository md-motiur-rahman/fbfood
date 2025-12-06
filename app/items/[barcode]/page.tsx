import Navbar from "@/app/components/Navbar";
import ProductCard from "@/app/components/ProductCard";
import Image from "next/image";
import Link from "next/link";
import ProductDetailClient from "../ProductDetailClient";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import { getPool } from "@/app/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

function getConnectionConfig(): string | PoolOptions {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const sslEnabled = String(process.env.DATABASE_SSL || "").toLowerCase() === "true" || String(process.env.DATABASE_SSL || "") === "1";
  const rejectUnauth = !(String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "").toLowerCase() === "false" || String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "") === "0");

  if (rawUrl) {
    const cleaned = rawUrl.replace(/^\"|\"$/g, "").replace(/^'|'$/g, "");
    try {
      const u = new URL(cleaned);
      const cfg: PoolOptions = {
        host: u.hostname,
        port: u.port ? Number(u.port) : 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: decodeURIComponent(u.pathname.replace(/^\//, "")),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      };
      if (sslEnabled) {
        cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as unknown as PoolOptions["ssl"];
      }
      return cfg;
    } catch {
      return cleaned; // let driver parse raw URI
    }
  }
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = Number(process.env.DATABASE_PORT || 3306);
  if (!host || !user || !password || !database) {
    throw new Error("Database environment variables are not fully configured");
  }
  const cfg: PoolOptions = {
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  if (sslEnabled) {
    cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as unknown as PoolOptions["ssl"];
  }
  return cfg;
}

type DBProduct = {
  productname: string;
  category: string;      // slug
  brand: string | null;  // slug
  barcode: string;
  caseSize: string;
  palletQty: number | null;
  layerQty?: number | null;
  volume: string | null;
  picture: string;
  itemquery: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  promotion_type: "MONTHLY" | "SEASONAL" | null;
};

type DBCategory = { name: string; slug: string } | null;

type SimilarRow = { productname: string; category: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" };

async function getItemDetail(barcode: string) {
  const cfg = getConnectionConfig();
  const pool = getPool(cfg);

  const [prodRows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, category, brand, barcode, caseSize, palletQty, layerQty, volume, picture, itemquery, status, promotion_type FROM products WHERE barcode = ? LIMIT 1",
    [barcode]
  );
  const product = (prodRows[0] as unknown as DBProduct) || null;

  let category: DBCategory = null;
  let similar: SimilarRow[] = [];

  if (product) {
    const [catRows] = await pool.query<RowDataPacket[]>(
      "SELECT name, slug FROM categories WHERE slug = ? LIMIT 1",
      [product.category]
    );
    category = (catRows[0] as unknown as DBCategory) || null;

    const [simRows] = await pool.query<RowDataPacket[]>(
      "SELECT productname, category, barcode, picture, status FROM products WHERE category = ? AND barcode <> ? ORDER BY itemquery DESC, created_at DESC LIMIT 8",
      [product.category, product.barcode]
    );
    similar = simRows as unknown as SimilarRow[];
  }

  return { product, category, similar };
}

export default async function ItemDetailPage({ params }: { params: Promise<{ barcode: string }> }) {
  const { barcode } = await params;
  const { product, category, similar } = await getItemDetail(barcode);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Item Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            We couldn&apos;t find this item. Go back to {" "}
            <Link className="text-amber-700 hover:underline" href="/items">All Items</Link>.
          </p>
        </main>
      </div>
    );
  }

  const available = product.status === "AVAILABLE";
  const promoBadge = product.promotion_type === "MONTHLY" ? "Monthly Promo" : product.promotion_type === "SEASONAL" ? "Seasonal Promo" : null;

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

        {/* Main content: left image, right summary & actions */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Image */}
          <div className="lg:col-span-5">
            <figure className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white shadow-sm">
              <div className="relative aspect-square sm:aspect-4/3">
                <Image
                  src={product.picture}
                  alt={product.productname}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-contain bg-zinc-50"
                  unoptimized={product.picture.startsWith("http")}
                />
                {promoBadge ? (
                  <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-zinc-900 shadow">
                    {promoBadge}
                  </div>
                ) : null}
                {!available ? (
                  <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow">
                    Unavailable
                  </div>
                ) : null}
              </div>
            </figure>
          </div>

          {/* Summary and actions (right column) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ProductDetailClient
              productname={product.productname}
              barcode={product.barcode}
              caseSize={product.caseSize}
              available={available}
              brandSlug={product.brand}
              brandName={product.brand}
              categorySlug={category?.slug || null}
              categoryName={category?.name || null}
            />

            {/* Product Description table */}
            <div className="mt-2 rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-black/5 px-4 py-3 text-sm font-semibold text-zinc-800">
                Product Description
              </div>
              <dl className="text-sm text-zinc-800">
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-zinc-50 px-4 py-2">
                  <dt className="font-medium text-zinc-600">Brand:</dt>
                  <dd>
                    {product.brand ? (
                      <Link href={`/brands/${product.brand}`} className="text-amber-700 hover:underline">
                        {product.brand}
                      </Link>
                    ) : (
                      <span>—</span>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-white px-4 py-2">
                  <dt className="font-medium text-zinc-600">Product Code:</dt>
                  <dd>—</dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-zinc-50 px-4 py-2">
                  <dt className="font-medium text-zinc-600">Unit Barcode:</dt>
                  <dd className="font-mono text-xs break-all">{product.barcode}</dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-white px-4 py-2">
                  <dt className="font-medium text-zinc-600">Vat Code:</dt>
                  <dd>—</dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-zinc-50 px-4 py-2">
                  <dt className="font-medium text-zinc-600">Gross Weight:</dt>
                  <dd>—</dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-white px-4 py-2">
                  <dt className="font-medium text-zinc-600">Volume:</dt>
                  <dd>{product.volume || "—"}</dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] border-b border-black/5 bg-zinc-50 px-4 py-2">
                  <dt className="font-medium text-zinc-600">Pallet Qty:</dt>
                  <dd>{product.palletQty ?? "—"}</dd>
                </div>
                <div className="grid grid-cols-[160px,1fr] bg-white px-4 py-2">
                  <dt className="font-medium text-zinc-600">Layer Qty:</dt>
                  <dd>{product.layerQty ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Similar items */}
        <section className="mt-12 pt-8 border-t border-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Similar items</h2>
            {category && (
              <a href={`/categories/${category.slug}`} className="text-sm font-medium text-amber-700 hover:underline">View all</a>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard
                key={p.barcode}
                id={p.barcode}
                name={p.productname}
                img={p.picture}
                available={p.status === "AVAILABLE"}
                onDetailsHref={`/items/${p.barcode}`}
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
