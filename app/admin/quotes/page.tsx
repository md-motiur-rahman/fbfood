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
      if (sslEnabled) cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as unknown as PoolOptions["ssl"];
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
  if (sslEnabled) cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as unknown as PoolOptions["ssl"];
  return cfg;
}

async function getQuotes() {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id, q.name, q.email, q.company, q.phone, q.status, q.created_at,
            (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) as item_count
       FROM quotes q
      ORDER BY q.created_at DESC
      LIMIT 200`
  );

  await pool.end();
  return rows as {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    status: "NEW" | "REVIEWING" | "SENT" | "CLOSED";
    created_at: string;
    item_count: number;
  }[];
}

export default async function AdminQuotesPage() {
  const quotes = await getQuotes();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Quotes</h1>
        <div className="overflow-auto rounded border border-sky-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-50">
              <tr className="text-left">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-600">No quotes yet.</td></tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="border-t border-sky-100 hover:bg-sky-50/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link href={`/admin/quotes/${q.id}`} className="text-sky-700 hover:underline">#{q.id}</Link>
                    </td>
                    <td className="px-3 py-2">{q.name}{q.company ? <span className="text-slate-500"> · {q.company}</span> : null}</td>
                    <td className="px-3 py-2">{q.email}</td>
                    <td className="px-3 py-2">{q.item_count}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${q.status === 'NEW' ? 'bg-blue-100 text-blue-800' : q.status === 'REVIEWING' ? 'bg-sky-100 text-sky-800' : q.status === 'SENT' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{new Date(q.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/quotes/${q.id}`}
                        className="inline-flex items-center rounded-full border border-sky-200 px-3 py-1 text-xs font-medium text-sky-800 hover:bg-sky-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-600">Showing latest {quotes.length} quotes.</p>
      </div>
    </div>
  );
}
