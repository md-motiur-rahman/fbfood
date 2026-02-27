import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mysql, { type PoolOptions, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import { verifySessionToken } from "@/app/lib/auth";

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

function allowSort(field: string): string | null {
  const map: Record<string, string> = {
    productname: "`productname`",
    category: "`category`",
    brand: "`brand`",
    barcode: "`barcode`",
    caseSize: "`caseSize`",
    palletQty : "`palletQty `",
    status: "`status`",
    created_at: "`created_at`",
  };
  return map[field] || null;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fbfood_session")?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null as null;
}

export async function GET(req: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSizeRaw = Number(searchParams.get("pageSize") || 10);
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  const sortField = allowSort(searchParams.get("sort") || "created_at") || "`created_at`";
  const order = (searchParams.get("order") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  const where: string[] = [];
  const params: any[] = [];
  if (q) {
    where.push("(`productname` LIKE ? OR `barcode` LIKE ? OR `category` LIKE ? OR `brand` LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const offset = (page - 1) * pageSize;

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, productname, category, brand, barcode, caseSize, palletQty , picture, status, promotion_type, is_top_selling, created_at
       FROM products ${whereSql}
       ORDER BY ${sortField} ${order}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM products ${whereSql}`,
      params
    );

    await pool.end();

    const total = Number((countRows[0] as any)?.total || 0);
    const pages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({ items: rows, total, page, pageSize, pages });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  let body: any;
  try { body = await req.json(); } catch { body = null; }
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const productname = String(body.productname || "").trim();
  const category = String(body.category || "").trim();
  const brand = String(body.brand || "").trim();
  const barcode = String(body.barcode || "").trim();
  
  // caseSize treated as string for v3 schema compatibility
  const caseSize = String(body.caseSize || "").trim();
  
  // palletQty optional/nullable
  let palletQty: number | null = null;
  if (body.palletQty !== undefined && body.palletQty !== null && body.palletQty !== "") {
    palletQty = Number(body.palletQty);
  }

  const picture = String(body.picture || "").trim();
  const status = (String(body.status || "AVAILABLE").toUpperCase() === "UNAVAILABLE") ? "UNAVAILABLE" : "AVAILABLE";
  const itemquery = Number(body.itemquery || 0);
  const promoRaw = String(body.promotion_type || "").toUpperCase();
  const promotion_type = promoRaw === "MONTHLY" || promoRaw === "SEASONAL" ? promoRaw : null;
  const is_top_selling = body.is_top_selling === true || body.is_top_selling === 1 || String(body.is_top_selling) === "true";

  // Relaxed validation
  if (!productname || !category || !barcode || !picture || !caseSize) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    // picture_key, mime_type, size_bytes, width, height are not in the current schema
    // and caused "Unknown column" errors. Removed them from INSERT query.

    const [res] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products (productname, category, brand, barcode, caseSize, palletQty, picture, itemquery, status, promotion_type, is_top_selling, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [productname, category, brand || null, barcode, caseSize, palletQty, picture, itemquery || 1, status, promotion_type, is_top_selling]
    );

    await pool.end();

    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (err: any) {
    const code = err?.code;
    const msg = code === "ER_DUP_ENTRY" ? "A product with this barcode already exists." : (err?.message || "Insert failed");
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}
