import Navbar from "../components/Navbar";
import CategoryCard from "../components/CategoryCard";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";

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

async function getCategories() {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
  // Fetch ALL categories without limit
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, slug, picture FROM categories ORDER BY name ASC"
  );
  await pool.end();
  return rows as { id: number; name: string; slug: string; picture: string }[];
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">All Categories</h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Explore our comprehensive range of wholesale products. From snacks to beverages, find everything you need for your business at competitive bulk pricing.
            </p>
          </div>
        </div>
      </div>

      <main className="container-custom py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((c) => (
            <CategoryCard key={c.slug} name={c.name} slug={c.slug} img={c.picture} />
          ))}
          {categories.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <span className="text-slate-400 text-lg">No categories available at the moment.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
