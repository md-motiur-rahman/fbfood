import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/app/lib/auth";
import mysql, { type PoolOptions, type ResultSetHeader, type RowDataPacket, type Pool } from "mysql2/promise";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

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

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureUniqueSlug(pool: Pool, base: string): Promise<string> {
  let slug = base || "category";
  let suffix = 1;
  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as cnt FROM categories WHERE slug = ?", [slug]);
    const cnt = Number(((rows[0] as RowDataPacket) as { cnt?: number }).cnt ?? 0);
    if (cnt === 0) return slug;
    suffix += 1;
    slug = `${base || "category"}-${suffix}`;
  }
}

async function saveImageFromSource(src: string): Promise<{ publicPath: string } | null> {
  const baseDir = path.join(process.cwd(), "public", "uploads", "categories");
  await fs.mkdir(baseDir, { recursive: true });

  if (src.startsWith("data:image/")) {
    const [, meta, b64] = src.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/) || [];
    if (!meta || !b64) return null;
    const ext = meta.includes("jpeg") ? ".jpg" : meta.includes("png") ? ".png" : meta.includes("webp") ? ".webp" : ".bin";
    const buf = Buffer.from(b64, "base64");
    const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext;
    const abs = path.join(baseDir, name);
    await fs.writeFile(abs, buf);
    return { publicPath: "/uploads/categories/" + name };
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const urlExt = path.extname(new URL(src).pathname) || ".bin";
    const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + urlExt.toLowerCase();
    const abs = path.join(baseDir, name);
    await fs.writeFile(abs, buf);
    return { publicPath: "/uploads/categories/" + name };
  }

  if (src.startsWith("/")) {
    const absSrc = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    try {
      const data = await fs.readFile(absSrc);
      const ext = path.extname(absSrc) || ".bin";
      const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext.toLowerCase();
      const abs = path.join(baseDir, name);
      await fs.writeFile(abs, data);
      return { publicPath: "/uploads/categories/" + name };
    } catch {
      return { publicPath: src };
    }
  }

  return null;
}

export async function POST(req: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const text = await (file as File).text();
    const { headers, rows } = parseCSV(text);
    const nameIdx = headers.indexOf("name");
    const pictureIdx = headers.indexOf("picture");
    if (nameIdx === -1 || pictureIdx === -1) {
      return NextResponse.json({ error: "CSV must include headers: name, picture" }, { status: 400 });
    }

    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    let processed = 0;
    let inserted = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      processed++;
      const row = rows[i];
      const name = String(row[nameIdx] || "").trim();
      const pictureRaw = String(row[pictureIdx] || "").trim();

      if (!name || !pictureRaw) {
        errors.push({ row: i + 2, error: "Missing required: name or picture" });
        continue;
      }

      try {
        const saved = await saveImageFromSource(pictureRaw);
        const picture = saved?.publicPath || pictureRaw;
        const baseSlug = slugify(name);
        const uniqueSlug = await ensureUniqueSlug(pool, baseSlug);

        const [res] = await pool.execute<ResultSetHeader>(
          `INSERT INTO categories (name, slug, picture, picture_key) VALUES (?, ?, ?, ?)`,
          [name, uniqueSlug, picture, picture]
        );
        if ((res as ResultSetHeader).affectedRows > 0) inserted++;
      } catch (err) {
        errors.push({ row: i + 2, error: (err as { message?: string })?.message || "Insert failed" });
      }
    }

    await pool.end();

    return NextResponse.json({ ok: true, processed, inserted, skipped: processed - inserted, errors });
  } catch (err) {
    const msg = (err as { message?: string })?.message || "Bulk upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
