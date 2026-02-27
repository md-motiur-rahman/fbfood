import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mysql, { type PoolOptions, type ResultSetHeader } from "mysql2/promise";
import { verifySessionToken } from "@/app/lib/auth";

export const runtime = "nodejs";

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

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fbfood_session")?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null as null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  let body: unknown;
  try { body = await req.json(); } catch { body = null; }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const b = body as Record<string, unknown>;

  const routeParams = await ctx.params;
  const id = Number(routeParams.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const productname = String(b.productname ?? "").trim();
  const category = String((b.category ?? "")).trim();
  // Fixed: outerbarcode -> barcode
  const barcode = String(b.barcode ?? b.outerbarcode ?? "").trim();
  
  // caseSize is VARCHAR in new schema, but might be INT in old. Treat as string to be safe.
  const caseSize = String(b.caseSize ?? "").trim();
  
  // palletQty is optional (nullable INT) in new schema.
  // Handle 'palletSize' alias for backward compat.
  let palletQty: number | null = null;
  if (b.palletQty !== undefined && b.palletQty !== null && b.palletQty !== "") {
    palletQty = Number(b.palletQty);
  } else if (b.palletSize !== undefined && b.palletSize !== null && b.palletSize !== "") {
    palletQty = Number(b.palletSize);
  }

  const picture = String(b.picture ?? "").trim();
  const status = (String(b.status ?? "AVAILABLE").toUpperCase() === "UNAVAILABLE") ? "UNAVAILABLE" : "AVAILABLE";
  const itemquery = Number(b.itemquery ?? 0) || 1;
  const brand = b.brand != null ? String(b.brand) : null;
  const promoRaw = String(b.promotion_type ?? "").toUpperCase();
  const promotion_type = promoRaw === "MONTHLY" || promoRaw === "SEASONAL" ? promoRaw : null;
  const is_top_selling = b.is_top_selling === true || b.is_top_selling === 1 || String(b.is_top_selling) === "true";

  // Relaxed validation: palletQty is optional. caseSize must be present (as string).
  if (!productname || !category || !barcode || !picture || !caseSize) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    // picture_key, mime_type, size_bytes, width, height removed to match current DB schema
    const [res] = await pool.execute<ResultSetHeader>(
      `UPDATE products SET productname=?, category=?, brand=?, barcode=?, caseSize=?, palletQty=?, picture=?, itemquery=?, status=?, promotion_type=?, is_top_selling=? WHERE id=?`,
      [productname, category, brand, barcode, caseSize, palletQty, picture, itemquery, status, promotion_type, is_top_selling, id]
    );

    await pool.end();

    if ((res as ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, affected: (res as ResultSetHeader).affectedRows });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const msg = code === "ER_DUP_ENTRY" ? "A product with this barcode already exists." : ((err as { message?: string })?.message || "Update failed");
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const routeParams = await ctx.params;
  const id = Number(routeParams.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    const [res] = await pool.execute<ResultSetHeader>(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );

    await pool.end();

    if ((res as ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, affected: (res as ResultSetHeader).affectedRows });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const msg = (err as { message?: string })?.message || "Delete failed";
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}
