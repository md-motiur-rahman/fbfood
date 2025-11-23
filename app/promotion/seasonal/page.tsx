import Navbar from "../../components/Navbar";
import ClientAddToQuoteCard from "../../components/ClientAddToQuoteCard";
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

async function getSeasonalPromos() {
  const cfg = getConnectionConfig();
  // Use a dedicated pool here so we can safely close it after the query,
  // without affecting the global singleton used elsewhere.
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT productname, barcode, picture, status FROM products WHERE promotion_type = 'SEASONAL' ORDER BY created_at DESC LIMIT 24"
    );
    return rows as { productname: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" }[];
  } finally {
    await pool.end();
  }
}

export default async function SeasonalPromotionPage() {
  const promos = await getSeasonalPromos();

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Seasonal Promotion</h1>
            <p className="mt-1 text-sm text-zinc-600">Seasonally curated highlights and offers.</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {promos.map((p) => (
            <ClientAddToQuoteCard
              key={p.barcode}
              id={p.barcode}
              name={p.productname}
              img={p.picture}
              available={p.status === "AVAILABLE"}
              onDetailsHref={`/items/${p.barcode}`}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
