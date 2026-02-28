import Navbar from "./components/Navbar";
import Carousel, { type Slide } from "./components/Carousel";
import ClientAddToQuoteCard from "./components/ClientAddToQuoteCard";
import CategorySelect from "./components/CategorySelect";
import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";

export const runtime = "nodejs";
export const revalidate = 0;


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

async function getHomeData() {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [catRows] = await pool.query<RowDataPacket[]>(
    "SELECT name, slug FROM categories ORDER BY name ASC LIMIT 20"
  );

  const [latestRows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, barcode, picture, status FROM products ORDER BY created_at DESC LIMIT 4"
  );

  const [topRows] = await pool.query<RowDataPacket[]>(
    "SELECT productname, barcode, picture, status FROM products WHERE is_top_selling = 1 ORDER BY created_at DESC LIMIT 12"
  );

  const [slideRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, img, href, title, subtitle FROM carousel_slides WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC"
  );

  await pool.end();
  return {
    slides: slideRows as unknown as Slide[],
    categories: catRows as { name: string; slug: string }[],
    latest: latestRows as { productname: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" }[],
    topSell: topRows as { productname: string; barcode: string; picture: string; status: "AVAILABLE" | "UNAVAILABLE" }[],
  };
}

export default async function Home() {
  const { slides, categories, latest, topSell } = await getHomeData();

  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <main id="home">
        {/* Hero with Carousel - Full width impact */}
        <section className="relative w-full">
          {Array.isArray(slides) && slides.length > 0 ? (
            <div className="shadow-2xl shadow-slate-200">
              <Carousel items={slides} auto interval={6000} />
            </div>
          ) : (
             <div className="w-full h-[400px] bg-gradient-to-r from-sky-500 to-sky-600 flex items-center justify-center text-white">
                <div className="text-center">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to FB Food</h1>
                  <p className="text-xl opacity-90">Premium Quality Food Products</p>
                </div>
             </div>
          )}
        </section>

        {/* Categories Section - Clean Grid */}
        <section id="categories" className="container-custom py-16 bg-white">
          <div className="flex items-end justify-between mb-8 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Browse Categories</h2>
              <p className="text-slate-500 mt-2">Explore our wide range of products</p>
            </div>
            <Link href="/categories" className="group flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
              View all 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          
          <div className="hidden md:flex flex-wrap gap-3">
            {categories.slice(0, 20).map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50 hover:shadow-sm transition-all duration-200"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                {c.name}
              </Link>
            ))}
            {categories.length === 0 && (
              <div className="w-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <span className="text-slate-500 font-medium">No categories available yet.</span>
              </div>
            )}
          </div>
          
          <div className="block md:hidden">
            {categories.length > 0 ? (
              <CategorySelect categories={categories} />
            ) : (
              <div className="w-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <span className="text-slate-500 font-medium">No categories available yet.</span>
              </div>
            )}
          </div>
        </section> 

        {/* What's New Section - Card Grid */}
        <section id="whats-new" className="container-custom py-16">
          <div className="flex items-end justify-between mb-8">
             <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider mb-3">
                 Fresh Arrivals
               </div>
               <h2 className="text-3xl font-bold text-slate-900 tracking-tight">New Products</h2>
             </div>
             <Link href="/whats-new" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 hover:shadow-sm transition-all">
               View All Products
             </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest.map((p) => (
              <ClientAddToQuoteCard
                key={p.barcode}
                id={p.barcode}
                name={p.productname}
                img={p.picture}
                badge="New"
                available={p.status === "AVAILABLE"}
                onDetailsHref={`/items/${p.barcode}`}
              />
            ))}
            {latest.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 text-lg">Check back soon for new arrivals!</p>
              </div>
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
             <Link href="/whats-new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 shadow-sm transition-all">
               View All Products
             </Link>
          </div>
        </section>

        {/* Featured / Top Selling Section - Highlight Background */}
        <section id="top-selling" className="py-20 bg-slate-900 text-white relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
             <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-500 blur-3xl"></div>
             <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-sky-400 blur-3xl"></div>
          </div>
          
          <div className="container-custom relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Top Selling Items</h2>
                <p className="text-slate-400 text-lg max-w-xl">Our most popular products selected by customers just like you.</p>
              </div>
              <Link href="/top-selling" className="inline-flex items-center gap-2 text-sky-300 hover:text-sky-200 font-semibold transition-colors group">
                Browse Best Sellers
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topSell.map((p) => (
                <div key={p.barcode} className="transform transition-all duration-300 hover:-translate-y-2">
                   <ClientAddToQuoteCard
                    id={p.barcode}
                    name={p.productname}
                    img={p.picture}
                    available={p.status === "AVAILABLE"}
                    onDetailsHref={`/items/${p.barcode}`}
                    darkTheme={true}
                  />
                </div>
              ))}
              {topSell.length === 0 && (
                <div className="col-span-full text-center py-10 border border-slate-700 rounded-2xl border-dashed">
                  <span className="text-slate-400">No top selling products yet.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container-custom py-20">
           <div className="rounded-3xl bg-sky-600 relative overflow-hidden px-6 py-16 text-center shadow-2xl shadow-sky-200">
              <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
              <div className="relative z-10 max-w-2xl mx-auto">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to start your order?</h2>
                 <p className="text-sky-100 text-lg mb-8">Join thousands of satisfied customers who trust FB Food for quality and freshness.</p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/signup" className="px-8 py-3.5 bg-white text-sky-600 font-bold rounded-full hover:bg-sky-50 transition-colors shadow-lg">
                       Create an Account
                    </Link>
                    <Link href="/contact" className="px-8 py-3.5 bg-sky-700 text-white font-bold rounded-full hover:bg-sky-800 transition-colors border border-sky-500">
                       Contact Sales
                    </Link>
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
