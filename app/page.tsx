import Navbar from "./components/Navbar";
import Carousel, { type Slide } from "./components/Carousel";
import ClientAddToQuoteCard from "./components/ClientAddToQuoteCard";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";

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

async function getHomeData() {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [catRows] = await pool.query<RowDataPacket[]>(
    "SELECT name, slug FROM categories ORDER BY name ASC LIMIT 20"
  );

  const [latestRows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, barcode, picture, status FROM products ORDER BY created_at DESC LIMIT 8"
  );

  const [topRows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, barcode, picture, status FROM products ORDER BY itemquery DESC, created_at DESC LIMIT 8"
  );

  const [slideRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, img, href, title, subtitle FROM carousel_slides WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC"
  );

  await pool.end();
  return {
    slides: slideRows as unknown as Slide[],
    categories: catRows as { name: string; slug: string }[],
    latest: latestRows as { productname: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" }[],
    topSell: topRows as { productname: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" }[],
  };
}

export default async function Home() {
  const { slides, categories, latest, topSell } = await getHomeData();

  
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />

      <main id="home">
        {/* Hero with Carousel */}
        <section className="relative w-full pt-0 pb-10">
          {Array.isArray(slides) && slides.length > 0 ? (
            <Carousel items={slides} auto interval={6000} />
          ) : null}
        </section>

        {/* Categories quick links */}
        <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Link href="/categories" className="text-sm font-medium text-amber-700 hover:underline">View all</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((c) => (
              <a
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-zinc-50"
              >
                {c.name}
              </a>
            ))}
            {categories.length === 0 && (
              <span className="text-sm text-zinc-600">No categories yet.</span>
            )}
          </div>
        </section> 

        {/* What's New */}
        <section id="whats-new" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">What&apos;s New</h2>
            <a href="/whats-new" className="text-sm font-medium text-amber-700 hover:underline">View all</a>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {latest.map((p) => (
              <ClientAddToQuoteCard
                key={p.barcode}
                id={p.barcode}
                name={p.productname}
                img={p.picture}
                badge="New"
                available={p.status === "AVAILABLE"}
                onDetailsHref={`/items/${p.barcode}`}
              />
            ))}
            {latest.length === 0 && (
              <div className="col-span-full text-sm text-zinc-600">No products yet.</div>
            )}
          </div>
        </section>

        {/* Top Selling */}
        <section id="top-selling" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Top Selling</h2>
            <a href="/top-selling" className="text-sm font-medium text-amber-700 hover:underline">View all</a>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {topSell.map((p) => (
              <ClientAddToQuoteCard
                key={p.barcode}
                id={p.barcode}
                name={p.productname}
                img={p.picture}
                available={p.status === "AVAILABLE"}
                onDetailsHref={`/items/${p.barcode}`}
              />
            ))}
            {topSell.length === 0 && (
              <div className="col-span-full text-sm text-zinc-600">No products yet.</div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faqs" className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">FAQ&apos;s</h2>
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
        </section>
      </main>
    </div>
  );
}
