import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";
import { QuotesTrendChart, TopProductsBarChart } from "./QuotesChartsClient";

export const runtime = "nodejs";
export const revalidate = 0;

function getConnectionConfig(): string | PoolOptions {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const sslEnabled = String(process.env.DATABASE_SSL || "").toLowerCase() === "true" || String(process.env.DATABASE_SSL || "") === "1";
  const rejectUnauth = !(String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "").toLowerCase() === "false" || String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "") === "0");

  if (rawUrl) {
    const cleaned = rawUrl.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
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
      return cleaned;
    }
  }
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = Number(process.env.DATABASE_PORT || 3306);
  if (!host || !user || !password || !database) throw new Error("Database variables not configured");
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

async function getDashboardData() {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  // Quotes: total + last 7 days count per day
  const [quoteRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*)                          AS total_quotes,
       SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) AS quotes_7d
     FROM quotes`
  );

  const [quoteTrendRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE(created_at) AS d, COUNT(*) AS c
       FROM quotes
      WHERE created_at >= NOW() - INTERVAL 7 DAY
      GROUP BY DATE(created_at)
      ORDER BY d ASC`
  );

  // Users: total + new users last 7 days
  const [userRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*)                          AS total_users,
       SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) AS users_7d
     FROM users`
  );

  // Top products by itemquery
  const [topProductsRows] = await pool.query<RowDataPacket[]>(
    `SELECT productname, barcode, itemquery
       FROM products
      ORDER BY itemquery DESC, created_at DESC
      LIMIT 5`
  );

  await pool.end();

  const quotes = quoteRows[0] as { total_quotes: number; quotes_7d: number };
  const users = userRows[0] as { total_users: number; users_7d: number };

  const quoteTrend = (quoteTrendRows as { d: Date; c: number }[]).map((row) => ({
    date: new Date(row.d),
    count: Number(row.c) || 0,
  }));

  const topProducts = (topProductsRows as { productname: string; barcode: string; itemquery: number }[]).map((p) => ({
    productname: p.productname,
    barcode: p.barcode,
    itemquery: Number(p.itemquery) || 0,
  }));

  return { quotes, quoteTrend, users, topProducts };
}

export default async function AdminDashboard() {
  const { quotes, quoteTrend, users, topProducts } = await getDashboardData();

  const quoteTrendData = quoteTrend.map((pt) => ({
    label: pt.date.toLocaleDateString(),
    count: pt.count,
  }));

  return (
    <div className="p-4 sm:p-6 grid gap-6 bg-zinc-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-xs text-zinc-600">Live overview of quotes, users, and product interest.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quotes KPI with sparkline */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-500">Quotes (all time)</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{quotes.total_quotes ?? 0}</div>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Last 7 days: {quotes.quotes_7d ?? 0}
            </span>
          </div>
          <div className="mt-1 h-16">
            <QuotesTrendChart data={quoteTrendData} />
          </div>
        </div>

        {/* Users KPI */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-500">Users (all time)</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{users.total_users ?? 0}</div>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              New (7d): {users.users_7d ?? 0}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, ((users.users_7d || 0) / Math.max(1, users.total_users || 1)) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 whitespace-nowrap">Share of new</span>
          </div>
        </div>

        {/* Top products summary */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-500">Top products by interest</div>
              <div className="mt-1 text-base font-semibold text-zinc-900">Based on itemquery</div>
            </div>
          </div>
          <div className="mt-2 space-y-1.5 text-xs">
            {topProducts.length === 0 ? (
              <p className="text-[11px] text-zinc-400">No products yet.</p>
            ) : (
              topProducts.map((p) => (
                <div key={p.barcode} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900">{p.productname}</div>
                    <div className="font-mono text-[10px] text-zinc-500 truncate">{p.barcode}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-600">
                    <span className="inline-flex h-5 min-w-6 items-center justify-center rounded-full bg-amber-50 px-1 text-[11px] font-medium text-amber-800">
                      {p.itemquery}
                    </span>
                    <span>hits</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom: top products chart & quick links */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products bar chart */}
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Top products by itemquery</h2>
              <p className="text-xs text-zinc-500">Highest itemquery values from the products table.</p>
            </div>
            <Link
              href="/admin/products"
              className="hidden sm:inline-flex items-center rounded-full border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
            >
              Manage products
            </Link>
          </div>
          <TopProductsBarChart products={topProducts} />
        </section>

        {/* Quick navigation */}
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Quick access</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <Link
              href="/admin/quotes"
              className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-3 hover:bg-amber-50 flex flex-col gap-1"
            >
              <span className="text-xs font-medium text-amber-800">Quotes</span>
              <span className="text-[11px] text-zinc-600">Review and respond to customer quote requests.</span>
            </Link>
            <Link
              href="/admin/products"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 hover:bg-zinc-100 flex flex-col gap-1"
            >
              <span className="text-xs font-medium text-zinc-800">Products</span>
              <span className="text-[11px] text-zinc-600">Manage catalog, pricing, and visibility.</span>
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 hover:bg-zinc-100 flex flex-col gap-1"
            >
              <span className="text-xs font-medium text-zinc-800">Categories</span>
              <span className="text-[11px] text-zinc-600">Organize products by category.</span>
            </Link>
            <Link
              href="/admin/brands"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 hover:bg-zinc-100 flex flex-col gap-1"
            >
              <span className="text-xs font-medium text-zinc-800">Brands</span>
              <span className="text-[11px] text-zinc-600">Manage brands and logos.</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
