import Navbar from "@/app/components/Navbar";
import ClientAddToQuoteCard from "@/app/components/ClientAddToQuoteCard";
import Image from "next/image";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";

export const runtime = "nodejs";
export const revalidate = 0;

function getConnectionConfig(): string | PoolOptions {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const sslEnabled =
    String(process.env.DATABASE_SSL || "").toLowerCase() === "true" ||
    String(process.env.DATABASE_SSL || "") === "1";
  const rejectUnauth = !(
    String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "").toLowerCase() ===
      "false" ||
    String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "") === "0"
  );

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
        cfg.ssl = {
          minVersion: "TLSv1.2",
          rejectUnauthorized: rejectUnauth,
        } as unknown as PoolOptions["ssl"];
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
    cfg.ssl = {
      minVersion: "TLSv1.2",
      rejectUnauthorized: rejectUnauth,
    } as unknown as PoolOptions["ssl"];
  }
  return cfg;
}

async function getBrandAndProducts(slug: string) {
  const normalized = slug.toLowerCase();
  const cfg = getConnectionConfig();
  const pool =
    typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [brandRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, slug, picture FROM brands WHERE slug = ? LIMIT 1",
    [normalized]
  );
  const brand =
    (brandRows[0] as
      | { id: number; name: string; slug: string; picture: string }
      | undefined) || null;

  let products: {
    productname: string;
    barcode: string;
    picture: string;
    status: "AVAILABLE" | "UNAVAILABLE";
  }[] = [];
  if (brand) {
    const [prodRows] = await pool.query<RowDataPacket[]>(
      "SELECT productname, barcode, picture, status FROM products WHERE brand = ? ORDER BY itemquery DESC, created_at DESC",
      [normalized]
    );
    products = prodRows as {
      productname: string;
      barcode: string;
      picture: string;
      status: "AVAILABLE" | "UNAVAILABLE";
    }[];
  }

  await pool.end();
  return { brand, products };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { brand, products } = await getBrandAndProducts(slug);

  if (!brand) {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Brand Not Found
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            We couldn&apos;t find this brand. Go back to{" "}
            <Link className="text-amber-700 hover:underline" href="/brands">
              Brands
            </Link>
            .
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Hero */}
        <figure className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white shadow-sm">
          <div className="relative w-full h-80 sm:h-[420px] md:h-[480px] overflow-hidden">
            <Image
              src={brand.picture}
              alt={brand.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized={brand.picture.startsWith("http")}
            />
            <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-black/50 via-black/10 to-transparent" />
            <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center ">
              <div className="bg-black/70 px-4 py-2 rounded-md">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                  {brand.name}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-white/90 drop-shadow ">
                  {products.length} items • Pricing confirmed based on order
                  quantity
                </p>
              </div>
            </figcaption>
          </div>
        </figure>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/brands"
            className="inline-flex h-9 items-center rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-zinc-50"
          >
            Back to Brands
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400"
          >
            Get a Quote
          </Link>
        </div>

        {/* Grid of products */}
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.length === 0 ? (
              <div className="col-span-full text-sm text-zinc-600">
                No products available from this brand yet.
              </div>
            ) : (
              products.map((p) => (
                <ClientAddToQuoteCard
                  key={p.barcode}
                  id={p.barcode}
                  name={p.productname}
                  img={p.picture}
                  available={p.status === "AVAILABLE"}
                  onDetailsHref={`/items/${p.barcode}`}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
