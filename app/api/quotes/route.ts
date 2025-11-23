import { NextResponse } from "next/server";
import mysql, { type PoolOptions, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

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

export async function POST(req: Request) {
  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const b = payload as {
    customer?: { name?: string; email?: string; company?: string; phone?: string; notes?: string };
    items?: { barcode?: string; quantity?: number }[];
  };

  const name = String(b.customer?.name || "").trim();
  const email = String(b.customer?.email || "").trim();
  const company = String(b.customer?.company || "").trim();
  const phone = String(b.customer?.phone || "").trim();
  const notes = String(b.customer?.notes || "").trim();
  const items = Array.isArray(b.items) ? b.items : [];

  if (!name || !email || items.length === 0) {
    return NextResponse.json({ error: "Missing name, email or items" }, { status: 400 });
  }

  // Normalize items and validate quantities
  const normalized = items
    .map((it) => ({ barcode: String(it.barcode || "").trim(), quantity: Number(it.quantity || 1) }))
    .filter((it) => it.barcode && it.quantity > 0);
  if (normalized.length === 0) return NextResponse.json({ error: "No valid items" }, { status: 400 });

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    // Start transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert quote
      const [qres] = await conn.execute<ResultSetHeader>(
        `INSERT INTO quotes (name, email, company, phone, notes, status) VALUES (?, ?, ?, ?, ?, 'NEW')`,
        [name, email, company || null, phone || null, notes || null]
      );
      const quoteId = qres.insertId;

      // Fetch product snapshots, insert items, and bump itemquery per product
      for (const it of normalized) {
        const [rows] = await conn.query<RowDataPacket[]>(
          `SELECT productname, picture FROM products WHERE barcode = ? LIMIT 1`,
          [it.barcode]
        );
        const snap = rows[0] as { productname?: string; picture?: string } | undefined;
        const productname = snap?.productname || it.barcode;
        const picture = snap?.picture || null;
        await conn.execute<ResultSetHeader>(
          `INSERT INTO quote_items (quote_id, barcode, productname, picture, quantity) VALUES (?, ?, ?, ?, ?)`,
          [quoteId, it.barcode, productname, picture, it.quantity]
        );
        // increment itemquery to track interest driven by quotes
        await conn.execute<ResultSetHeader>(
          `UPDATE products SET itemquery = COALESCE(itemquery, 0) + ? WHERE barcode = ?`,
          [it.quantity, it.barcode]
        );
      }

      await conn.commit();
      conn.release();
      await pool.end();

      // TODO: send email to customer + admin (SMTP/Resend)

      return NextResponse.json({ ok: true, id: quoteId });
    } catch (err) {
      try { await conn.rollback(); } catch {}
      conn.release();
      await pool.end();
      const msg = (err as { message?: string })?.message || "Failed to create quote";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (e) {
    const msg = (e as { message?: string })?.message || "Failed to create quote";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
