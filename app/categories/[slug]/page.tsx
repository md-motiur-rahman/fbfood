import Navbar from "@/app/components/Navbar";
import ClientAddToQuoteCard from "@/app/components/ClientAddToQuoteCard";
import Image from "next/image";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";

export const runtime = "nodejs";

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

async function getCategoryAndProducts(slug: string) {
  const normalized = slug.toLowerCase();
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [catRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, slug, picture FROM categories WHERE slug = ? LIMIT 1",
    [normalized]
  );
  const category = (catRows[0] as any) || null;

  const [prodRows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, category, barcode, caseSize, palletQty, picture, itemquery, status FROM products WHERE category = ? ORDER BY itemquery DESC, productname ASC",
    [normalized]
  );

  await pool.end();
  return { category, products: prodRows as any[] };
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { category, products } = await getCategoryAndProducts(slug);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {!category ? (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Category Not Found</h1>
            <p className="mt-2 text-sm text-zinc-600">We couldn\'t find this category. Go back to <a className="text-amber-700 hover:underline" href="/categories">Categories</a>.</p>
          </div>
        ) : (
          <>
            <figure className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white shadow-sm">
              <div className="relative aspect-3/2 sm:aspect-16/6">
                <Image src={category.picture} alt={category.name} fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
                <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">{category.name}</h1>
                  <p className="mt-2 text-xs sm:text-sm text-white/90 drop-shadow">{products.length} items • Pricing confirmed based on order quantity</p>
                </figcaption>
              </div>
            </figure>
            <div className="mt-3 flex items-center gap-2">
              <Link href="/categories" className="inline-flex h-9 items-center rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-zinc-50">Back to Categories</Link>
              <Link href="/contact" className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">Get a Quote</Link>
            </div>

            <section className="mt-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {products.length === 0 ? (
                  <div className="col-span-full text-sm text-zinc-600">No products available in this category yet.</div>
                ) : (
                  products.map((p, idx) => (
                    <ClientAddToQuoteCard
                      key={`${p.productname}-${idx}`}
                      id={p.barcode}
                      name={p.productname}
                      img={p.picture}
                      available={p.status === "AVAILABLE"}
                      onDetailsHref={`/items/${p.barcode}`}
                    />
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
