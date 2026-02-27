import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";

export const runtime = "nodejs";
export const revalidate = 0;

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
  if (!host || !user || !password || !database) throw new Error("Database variables not configured");
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

async function getQuoteWithItems(id: number) {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [qRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, company, phone, notes, status, created_at
       FROM quotes
      WHERE id = ?
      LIMIT 1`,
    [id]
  );

  const quote = (qRows[0] as {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    notes: string | null;
    status: string;
    created_at: string;
  }) || null;

  let items: {
    id: number;
    barcode: string;
    productname: string;
    picture: string | null;
    quantity: number;
  }[] = [];

  if (quote) {
    const [iRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, barcode, productname, picture, quantity
         FROM quote_items
        WHERE quote_id = ?
        ORDER BY id ASC`,
      [id]
    );
    items = iRows as unknown as typeof items;
  }

  await pool.end();
  return { quote, items };
}

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Invalid quote ID.
          </div>
          <Link
            href="/admin/quotes"
            className="mt-4 inline-flex items-center rounded-full border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50"
          >
            ← Back to quotes
          </Link>
        </div>
      </div>
    );
  }

  const { quote, items } = await getQuoteWithItems(numericId);

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Quote not found.
          </div>
          <Link
            href="/admin/quotes"
            className="mt-4 inline-flex items-center rounded-full border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50"
          >
            ← Back to quotes
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = new Date(quote.created_at);

  const statusBadgeClass =
    quote.status === "NEW"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : quote.status === "REVIEWING"
      ? "bg-sky-50 text-sky-800 border-sky-200"
      : quote.status === "SENT"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Admin</span>
              <span>/</span>
              <Link href="/admin/quotes" className="hover:underline">Quotes</Link>
              <span>/</span>
              <span className="text-slate-700 font-medium">#{quote.id}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              Quote <span className="font-mono text-base text-slate-700">#{quote.id}</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Created {createdAt.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${statusBadgeClass}`}
            >
              {quote.status}
            </span>
            <Link
              href="/admin/quotes"
              className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-sky-50"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Main layout: customer + meta */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1.4fr)]">
          {/* Customer card */}
          <div className="rounded-xl border border-slate-200 bg-white/90 shadow-sm px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Customer details</h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">Name</dt>
                <dd className="mt-0.5 text-slate-900">{quote.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Email</dt>
                <dd className="mt-0.5 text-slate-900 break-all">{quote.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Company</dt>
                <dd className="mt-0.5 text-slate-900">{quote.company || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Phone</dt>
                <dd className="mt-0.5 text-slate-900">{quote.phone || "—"}</dd>
              </div>
            </dl>
            {quote.notes ? (
              <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
                <div className="text-xs font-medium text-slate-500 mb-1">Customer notes</div>
                <p className="whitespace-pre-wrap text-sm text-slate-800">{quote.notes}</p>
              </div>
            ) : null}
          </div>

          {/* Meta / summary card */}
          <div className="rounded-xl border border-slate-200 bg-linear-to-br from-sky-50 to-white shadow-sm px-4 py-4 text-sm flex flex-col gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500">Quote ID</div>
              <div className="mt-0.5 font-mono text-sm text-slate-900">#{quote.id}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Status</div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass}`}
                >
                  {quote.status}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Items count</div>
              <div className="mt-0.5 text-sm text-slate-900">{items.length}</div>
            </div>
          </div>
        </section>

        {/* Items table */}
        <section className="rounded-xl border border-slate-200 bg-white/90 shadow-sm px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Quote items</h2>
              <p className="text-xs text-slate-500">All SKUs requested in this quote.</p>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-600">No items on this quote.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Barcode</th>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-left font-medium">Quantity</th>
                    <th className="px-3 py-2 text-left font-medium">Picture</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr
                      key={it.id}
                      className={
                        idx % 2 === 0
                          ? "bg-white border-t border-slate-100"
                          : "bg-slate-50/70 border-t border-slate-100"
                      }
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-800">{it.barcode}</td>
                      <td className="px-3 py-2 text-slate-900">
                        <div className="line-clamp-2 max-w-xs">{it.productname}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-900">{it.quantity}</td>
                      <td className="px-3 py-2">
                        {it.picture ? (
                          <div className="h-10 w-10 overflow-hidden rounded border border-slate-200 bg-slate-50">
                            <img
                              src={it.picture}
                              alt={it.productname}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
