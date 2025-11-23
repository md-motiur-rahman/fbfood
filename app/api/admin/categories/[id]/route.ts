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

  let body: any;
  try { body = await req.json(); } catch { body = null; }
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const routeParams = await ctx.params;
  const id = Number(routeParams.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const picture = String(body.picture || "").trim();
  const picture_key = String(body.picture_key || picture || "");
  const mime_type = body.mime_type ? String(body.mime_type) : null;
  const size_bytes = body.size_bytes ? Number(body.size_bytes) : null;
  const width = body.width ? Number(body.width) : null;
  const height = body.height ? Number(body.height) : null;

  if (!name || !slug || !picture) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    const [res] = await pool.execute<ResultSetHeader>(
      `UPDATE categories SET name=?, slug=?, picture=?, picture_key=?, mime_type=?, size_bytes=?, width=?, height=? WHERE id=?`,
      [name, slug, picture, picture_key || null, mime_type, size_bytes, width, height, id]
    );

    await pool.end();

    return NextResponse.json({ ok: true, affected: res.affectedRows });
  } catch (err: any) {
    const code = err?.code;
    const msg = code === "ER_DUP_ENTRY" ? "A category with this slug already exists." : (err?.message || "Update failed");
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
      `DELETE FROM categories WHERE id = ?`,
      [id]
    );

    await pool.end();

    if ((res as ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, affected: (res as ResultSetHeader).affectedRows });
  } catch (err: any) {
    const code = err?.code;
    const msg = err?.message || "Delete failed";
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}
