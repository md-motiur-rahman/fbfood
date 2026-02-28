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
  gross_weight: string | null;
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
    "SELECT productname, category, brand, barcode, caseSize, palletQty, layerQty, volume, gross_weight, picture, itemquery, status, promotion_type FROM products WHERE barcode = ? LIMIT 1",
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Item Not Found</h1>
                <p className="text-slate-600 mb-8">
                    We couldn&apos;t find the product you&apos;re looking for. It might have been removed or the link is incorrect.
                </p>
                <Link className="inline-flex h-12 px-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors" href="/">
                    Return Home
                </Link>
            </div>
        </main>
      </div>
    );
  }

  const available = product.status === "AVAILABLE";
  const promoBadge = product.promotion_type === "MONTHLY" ? "Monthly Promo" : product.promotion_type === "SEASONAL" ? "Seasonal Promo" : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
            <nav aria-label="Breadcrumb" className="text-sm text-slate-500 font-medium">
            <ol className="flex items-center gap-2 overflow-hidden">
                <li>
                <Link className="hover:text-sky-600 transition-colors" href="/">Home</Link>
                </li>
                <li><svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></li>
                <li>
                <Link className="hover:text-sky-600 transition-colors" href="/categories">Categories</Link>
                </li>
                {category && (
                <>
                    <li><svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></li>
                    <li>
                    <Link className="hover:text-sky-600 transition-colors whitespace-nowrap" href={`/categories/${category.slug}`}>{category.name}</Link>
                    </li>
                </>
                )}
                <li><svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></li>
                <li className="text-slate-900 truncate">{product.productname}</li>
            </ol>
            </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Main Product Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left: Image Gallery Area */}
                <div className="p-6 lg:p-12 bg-slate-50/50 flex items-center justify-center relative border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div className="relative w-full aspect-square max-w-md mx-auto">
                        <Image
                            src={product.picture}
                            alt={product.productname}
                            fill
                            priority
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-contain hover:scale-105 transition-transform duration-500"
                            unoptimized={product.picture.startsWith("http")}
                        />
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                        {promoBadge && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-200">
                                {promoBadge}
                            </span>
                        )}
                        {!available && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg">
                                Out of Stock
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="p-6 lg:p-12 flex flex-col h-full">
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

                    {/* Specs Grid */}
                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Product Specifications</h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Brand</dt>
                                <dd className="text-sm font-semibold text-slate-900">
                                    {product.brand ? (
                                        <Link href={`/brands/${product.brand}`} className="hover:text-sky-600 transition-colors underline decoration-slate-300 underline-offset-2">
                                            {product.brand}
                                        </Link>
                                    ) : "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Barcode</dt>
                                <dd className="text-sm font-mono font-semibold text-slate-900 break-all">{product.barcode}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Pallet Qty</dt>
                                <dd className="text-sm font-semibold text-slate-900">{product.palletQty ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Layer Qty</dt>
                                <dd className="text-sm font-semibold text-slate-900">{product.layerQty ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Gross Weight</dt>
                                <dd className="text-sm font-semibold text-slate-900">{product.gross_weight || "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Volume</dt>
                                <dd className="text-sm font-semibold text-slate-900">{product.volume || "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase mb-1">Category</dt>
                                <dd className="text-sm font-semibold text-slate-900">
                                    {category ? (
                                        <Link href={`/categories/${category.slug}`} className="hover:text-sky-600 transition-colors">
                                            {category.name}
                                        </Link>
                                    ) : "—"}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Similar Items Section */}
        {similar.length > 0 && (
            <section className="mt-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Similar Products</h2>
                        <p className="text-slate-500 text-sm mt-1">You might also like these items</p>
                    </div>
                    {category && (
                        <Link 
                            href={`/categories/${category.slug}`}
                            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 hover:shadow-sm transition-all"
                        >
                            View All in {category.name}
                        </Link>
                    )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
                </div>
                
                {category && (
                    <div className="mt-8 text-center sm:hidden">
                        <Link 
                            href={`/categories/${category.slug}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 shadow-sm transition-all"
                        >
                            View All in {category.name}
                        </Link>
                    </div>
                )}
            </section>
        )}
      </main>
    </div>
  );
}
