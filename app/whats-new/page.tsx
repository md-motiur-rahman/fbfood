import Link from "next/link";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";

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

async function getLatest() {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, barcode, picture, status FROM products ORDER BY created_at DESC LIMIT 10"
  );
  await pool.end();
  return rows as { productname: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" }[];
}

export default async function WhatsNewPage() {
  const latest = await getLatest();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">What&apos;s New</h1>
            <p className="mt-1 text-sm text-slate-600">Latest 10 arrivals to quickly stock your shelves.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/items" className="inline-flex h-9 items-center rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-slate-50">All Items</Link>
            <Link href="/contact" className="inline-flex h-9 items-center rounded-full bg-sky-500 px-4 text-sm font-semibold text-slate-900 shadow hover:bg-sky-400">Get a Quote</Link>
          </div>
        </header>

        {/* Grid */}
        <section className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {latest.map((p) => (
            <ProductCard
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
            <div className="col-span-full text-sm text-slate-600">No new items at the moment. Check back soon!</div>
          )}
        </section>
      </main>
    </div>
  );
}
