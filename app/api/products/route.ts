import { NextResponse } from "next/server";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import { getPool } from "@/app/lib/db";

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(1000, Math.max(1, Number(url.searchParams.get("pageSize") || "100")));
    const qRaw = (url.searchParams.get("q") || "").trim();
    const q = qRaw.toLowerCase();

    const cfg = getConnectionConfig();
    const pool = getPool(cfg);

    const offset = (page - 1) * pageSize;

    const params: any[] = [];
    let where = "WHERE 1=1";

    if (q) {
      where += " AND (LOWER(productname) LIKE ? OR LOWER(barcode) LIKE ? OR LOWER(category) LIKE ? OR LOWER(IFNULL(brand, '')) LIKE ?)";
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM products ${where}`,
      params
    );
    const total = Number((countRows[0] as any)?.cnt || 0);

    params.push(pageSize, offset);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT productname, category, brand, barcode, picture, status
       FROM products
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    return NextResponse.json({
      items: rows,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load products" }, { status: 500 });
  }
}
