import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import DashboardClient from "./DashboardClient";

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
      ORDER BY is_top_selling DESC, itemquery DESC, created_at DESC
      LIMIT 5`
  );

  await pool.end();

  const quotes = quoteRows[0] as { total_quotes: number; quotes_7d: number };
  const users = userRows[0] as { total_users: number; users_7d: number };

  const quoteTrend = (quoteTrendRows as { d: Date; c: number }[]).map((row) => ({
    label: new Date(row.d).toLocaleDateString(),
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
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
