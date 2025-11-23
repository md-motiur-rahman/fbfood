import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mysql, { type PoolOptions, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { verifySessionToken } from "@/app/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fbfood_session")?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null as null;
}

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

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Lookahead for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => parseCSVLine(l));
  return { headers, rows };
}

function toNumber(val: unknown): number | null {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const cleaned = s.replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Tolerant integer extractor for human-formatted quantities like "12 x 1kg", "12pcs", "12/1kg".
function toPositiveIntLoose(val: unknown): number | null {
  if (val == null) return null;
  let s = String(val).trim();
  if (!s) return null;
  // normalize unicode times (×) to x
  s = s.replace(/\u00D7/g, 'x');
  // find first integer in string
  const m = s.match(/(\d{1,9})/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizePicture(input: string): string {
  let s = input.trim();
  if (!s) return "";
  // Strip surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  // Excel HYPERLINK formula: =HYPERLINK("url", "text") or =HYPERLINK('url','text')
  const m = s.match(/^=\s*HYPERLINK\((?:\"([^\"]+)\"|'([^']+)')[^\)]*\)/i);
  if (m) {
    s = (m[1] || m[2] || "").trim();
  }
  return s.trim();
}

function findPictureFallback(row: string[]): string {
  for (const v of row) {
    const s = String(v || "").trim();
    const n = normalizePicture(s);
    if (!n) continue;
    if (/^https?:\/\//i.test(n)) return n; // absolute URL
    if (/^\//.test(n)) return n; // site-relative path
    if (/\.(png|jpe?g|webp|gif|svg|avif)(?:\?|#|$)/i.test(n)) return n; // looks like image filename
  }
  return "";
}

function resolveDirectUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  // Dropbox shared links => force direct download
  if (/^https?:\/\/www\.dropbox\.com\//i.test(url)) {
    url = url.replace(/\?dl=0$/i, "?dl=1");
  }
  // Google Drive file links => convert to uc?export=download&id=FILE_ID
  const m1 = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//i);
  if (m1) {
    url = `https://drive.google.com/uc?export=download&id=${m1[1]}`;
  }
  const m2 = url.match(/^https?:\/\/drive\.google\.com\/open\?id=([^&]+)/i);
  if (m2) {
    url = `https://drive.google.com/uc?export=download&id=${m2[1]}`;
  }
  return url;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };
  return map[mime] || "";
}

function detectMimeFromBuffer(buf: Buffer): { mime: string; ext: string } {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: ".jpg" };
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return { mime: "image/png", ext: ".png" };
  if (buf.length >= 6 && buf.slice(0, 6).toString() === "GIF87a") return { mime: "image/gif", ext: ".gif" };
  if (buf.length >= 6 && buf.slice(0, 6).toString() === "GIF89a") return { mime: "image/gif", ext: ".gif" };
  if (buf.length >= 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return { mime: "image/webp", ext: ".webp" };
  const text = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (text.startsWith("<svg") || text.startsWith("<?xml")) return { mime: "image/svg+xml", ext: ".svg" };
  return { mime: "application/octet-stream", ext: ".bin" };
}

async function findLocalByFilename(name: string): Promise<string | null> {
  const base = name.replace(/^\/*/, "");
  const paths = [
    path.join(process.cwd(), "public", "images", base),
    path.join(process.cwd(), "public", "source-images", base),
    path.join(process.cwd(), "public", base),
  ];
  for (const p of paths) {
    try { const st = await fs.stat(p); if (st && st.isFile()) return p; } catch {}
  }
  return null;
}

async function storeImage(picture: string): Promise<{ publicPath: string; key: string } | null> {
  try {
    if (!picture) return null;
    // Already a stored asset
    if (picture.startsWith("/uploads/products/")) {
      return { publicPath: picture, key: picture };
    }

    const baseDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(baseDir, { recursive: true });

    // Data URL
    if (picture.startsWith("data:")) {
      const m = picture.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return null;
      const mime = m[1];
      const buf = Buffer.from(m[2], "base64");
      let ext = extFromMime(mime) || ".bin";
      const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext;
      const absPath = path.join(baseDir, name);
      await fs.writeFile(absPath, buf);
      const publicPath = "/uploads/products/" + name;
      return { publicPath, key: publicPath };
    }

    // Remote URL: download and store locally
    if (/^https?:\/\//i.test(picture)) {
      const baseDir = path.join(process.cwd(), "public", "uploads", "products");
      await fs.mkdir(baseDir, { recursive: true });
      const direct = resolveDirectUrl(picture);
      const res = await fetch(direct, { cache: "no-store", headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36" } });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let ext = path.extname(new URL(direct).pathname);
      if (!ext) {
        const mimeExt = extFromMime(contentType.split(";")[0]);
        ext = mimeExt || ".bin";
      }
      const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext.toLowerCase();
      const absPath = path.join(baseDir, name);
      await fs.writeFile(absPath, buffer);
      const publicPath = "/uploads/products/" + name;
      return { publicPath, key: publicPath };
    }

    // Absolute public path: copy into uploads for consistency if exists; else reuse path
    if (picture.startsWith("/")) {
      const src = path.join(process.cwd(), "public", picture.replace(/^\//, ""));
      try {
        const stat = await fs.stat(src);
        if (stat && stat.isFile()) {
          const baseDir = path.join(process.cwd(), "public", "uploads", "products");
          await fs.mkdir(baseDir, { recursive: true });
          const ext = path.extname(src) || ".bin";
          const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext.toLowerCase();
          const absPath = path.join(baseDir, name);
          const buf = await fs.readFile(src);
          await fs.writeFile(absPath, buf);
          const publicPath = "/uploads/products/" + name;
          return { publicPath, key: publicPath };
        }
      } catch {
        // fall through and reuse the given path as-is
      }
      return { publicPath: picture, key: picture };
    }

    // Relative path under public: copy into uploads if present
    const candidate = path.join(process.cwd(), "public", picture.replace(/^\/*/, ""));
    try {
      const stat = await fs.stat(candidate);
      if (stat && stat.isFile()) {
        const baseDir = path.join(process.cwd(), "public", "uploads", "products");
        await fs.mkdir(baseDir, { recursive: true });
        const ext = path.extname(candidate) || ".bin";
        const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext.toLowerCase();
        const absPath = path.join(baseDir, name);
        const buf = await fs.readFile(candidate);
        await fs.writeFile(absPath, buf);
        const publicPath = "/uploads/products/" + name;
        return { publicPath, key: publicPath };
      }
    } catch {}

    // Bare filename in picture cell: try common public subdirs
    if (/^[^\\\/]+\.[a-zA-Z0-9]+$/.test(picture)) {
      const local = await findLocalByFilename(picture);
      if (local) {
        const baseDir = path.join(process.cwd(), "public", "uploads", "products");
        await fs.mkdir(baseDir, { recursive: true });
        const ext = path.extname(local) || ".bin";
        const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext.toLowerCase();
        const absPath = path.join(baseDir, name);
        const buf = await fs.readFile(local);
        await fs.writeFile(absPath, buf);
        const publicPath = "/uploads/products/" + name;
        return { publicPath, key: publicPath };
      }
    }

    // Raw base64 (without data URI header)
    const raw = picture.replace(/\s+/g, "");
    if (/^[a-z0-9+/=]+$/i.test(raw) && raw.length > 100) {
      try {
        const buf = Buffer.from(raw, "base64");
        if (buf.length > 0) {
          const { ext } = detectMimeFromBuffer(buf);
          const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext;
          const absPath = path.join(baseDir, name);
          await fs.writeFile(absPath, buf);
          const publicPath = "/uploads/products/" + name;
          return { publicPath, key: publicPath };
        }
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .trim()
    .replace(/[_\-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function POST(req: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const form = await req.formData();
  const file = form.get("file") as unknown as File | null;
  if (!file) return NextResponse.json({ error: "Missing CSV file (field name 'file')" }, { status: 400 });
  
  let csvText = "";
  try {
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }

  const { headers, rows } = parseCSV(csvText);
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => { headerIndex[h.toLowerCase()] = i; });

  // Required logical fields for v3 schema
  // productname, brand (slug), category (slug), picture, barcode
  const required = [
    "productname",
    "brand",
    "category",
    "picture",
    "barcode",
  ];
  const missing = required.filter((h) => !(h in headerIndex));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required columns: ${missing.join(", ")}` }, { status: 400 });
  }

  const idx = {
    productname: headerIndex["productname"],
    brand: headerIndex["brand"],          // brand slug
    category: headerIndex["category"],    // category slug
    picture: headerIndex["picture"],
    barcode: headerIndex["barcode"],      // v3 barcode
    caseSize: headerIndex["casesize"],    // optional text
    grossWeight: headerIndex["gross_weight"], // optional text
    volume: headerIndex["volume"],            // optional text
    palletQty: headerIndex["palletqty"],      // optional number
    layerQty: headerIndex["layerqty"],        // optional number (defaults 0 handled below)
    status: headerIndex["status"],            // optional enum
    promotionType: headerIndex["promotion_type"], // optional enum
  } as const;

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  const errors: { row: number; error: string }[] = [];

  try {
    const cfg = getConnectionConfig();
    const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

    const insertSql =
      "INSERT INTO products (productname, brand, category, picture, caseSize, barcode, gross_weight, volume, palletQty, layerQty, status, promotion_type, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

    // Ensure categories from CSV exist in the database
    const csvCategorySlugsSet = new Set<string>();
    // Ensure brands from CSV exist in the database
    const csvBrandSlugsSet = new Set<string>();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const catSlugRaw = String(row[idx.category] || "").trim().toLowerCase();
      if (catSlugRaw) csvCategorySlugsSet.add(catSlugRaw);

      if (idx.brand != null) {
        const brandSlugRaw = String(row[idx.brand] || "").trim().toLowerCase();
        if (brandSlugRaw) csvBrandSlugsSet.add(brandSlugRaw);
      }
    }

    // Upsert missing categories
    if (csvCategorySlugsSet.size > 0) {
      const slugsArr = Array.from(csvCategorySlugsSet);
      const [existingRows] = await pool.query<RowDataPacket[]>(
        "SELECT slug FROM categories WHERE slug IN (?)",
        [slugsArr]
      );
      const existingSet = new Set<string>(existingRows.map((r: any) => String(r.slug)));
      const missingCats = slugsArr.filter((s) => !existingSet.has(s));

      if (missingCats.length > 0) {
        const placeholders: string[] = [];
        const params: any[] = [];
        for (const slug of missingCats) {
          const name = titleCaseFromSlug(slug);
          const picture = "/file.svg"; // default placeholder available in /public
          const picture_key = picture;
          placeholders.push("(?, ?, ?, ?)");
          params.push(name, slug, picture, picture_key);
        }
        const sql = `INSERT INTO categories (name, slug, picture, picture_key) VALUES ${placeholders.join(", ")}`;
        await pool.query<ResultSetHeader>(sql, params);
      }
    }

    // Upsert missing brands
    if (csvBrandSlugsSet.size > 0) {
      const slugsArr = Array.from(csvBrandSlugsSet);
      const [existingRows] = await pool.query<RowDataPacket[]>(
        "SELECT slug FROM brands WHERE slug IN (?)",
        [slugsArr]
      );
      const existingSet = new Set<string>(existingRows.map((r: any) => String(r.slug)));
      const missingBrands = slugsArr.filter((s) => !existingSet.has(s));

      if (missingBrands.length > 0) {
        const placeholders: string[] = [];
        const params: any[] = [];
        for (const slug of missingBrands) {
          const name = titleCaseFromSlug(slug);
          const picture = "/file.svg"; // default placeholder available in /public
          const picture_key = picture;
          placeholders.push("(?, ?, ?, ?)");
          params.push(name, slug, picture, picture_key);
        }
        const sql = `INSERT INTO brands (name, slug, picture, picture_key) VALUES ${placeholders.join(", ")}`;
        await pool.query<ResultSetHeader>(sql, params);
      }
    }

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      processed++;
      try {
        const productname = String(row[idx.productname] || "").trim();
        const brand = String(row[idx.brand] || "").trim().toLowerCase();
        const category = String(row[idx.category] || "").trim().toLowerCase();
        const pictureRaw = String(row[idx.picture] || "");
        const picture = normalizePicture(pictureRaw);
        const barcode = String(row[idx.barcode] || "").trim();
        const caseSizeText = idx.caseSize != null ? String(row[idx.caseSize] || "").trim() : "";
        const grossWeightText = idx.grossWeight != null ? String(row[idx.grossWeight] || "").trim() : "";
        const volumeText = idx.volume != null ? String(row[idx.volume] || "").trim() : "";
        const palletQtyNum = toPositiveIntLoose(idx.palletQty != null ? row[idx.palletQty] : null) || null;
        const _layerParsed = toPositiveIntLoose(idx.layerQty != null ? row[idx.layerQty] : null);
        const layerQtyNum = _layerParsed != null ? _layerParsed : 0;
        const statusRaw = idx.status != null ? String(row[idx.status] || "").trim().toUpperCase() : "";
        const promotionRaw = idx.promotionType != null ? String(row[idx.promotionType] || "").trim().toUpperCase() : "";
        let storedPicture: string | null = null;
        try {
          const saved = await storeImage(picture);
          if (saved) {
            storedPicture = saved.publicPath;
          }
        } catch {
          storedPicture = null;
        }
        const status = statusRaw === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
        const promotion_type = promotionRaw === "MONTHLY" || promotionRaw === "SEASONAL" ? promotionRaw : null;

        const missingFields: string[] = [];
        if (!productname) missingFields.push("productname");
        if (!brand) missingFields.push("brand");
        if (!category) missingFields.push("category");
        if (!barcode) missingFields.push("barcode");
        if (!storedPicture) missingFields.push("picture");

        if (missingFields.length) {
          skipped++;
          const parts = [] as string[];
          if (missingFields.length) parts.push(`missing: ${missingFields.join(", ")}`);
          errors.push({ row: r + 2, error: (parts.join("; ") || "Missing required fields") + ` | picture_raw=${pictureRaw.substring(0,120)}` });
          continue;
        }

        await pool.execute<ResultSetHeader>(insertSql, [
          productname,
          brand,
          category,
          storedPicture!,
          caseSizeText,
          barcode,
          grossWeightText || null,
          volumeText || null,
          palletQtyNum != null ? Math.round(palletQtyNum) : null,
          Math.round(layerQtyNum),
          status,
          promotion_type,
        ]);
        inserted++;
      } catch (err: any) {
        const code = err?.code;
        if (code === "ER_DUP_ENTRY") {
          skipped++;
          errors.push({ row: r + 2, error: "Duplicate outerbarcode" });
        } else {
          skipped++;
          errors.push({ row: r + 2, error: err?.message || "Unknown error" });
        }
      }
    }

    await pool.end();

    return NextResponse.json({ ok: true, processed, inserted, skipped, errors });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Bulk upload failed" }, { status: 500 });
  }
}
