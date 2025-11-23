import mysql, { type PoolOptions, type RowDataPacket } from "mysql2/promise";
import Link from "next/link";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

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

function verifySessionToken(token: string | undefined): { email?: string } | null {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return { email: typeof data.email === "string" ? data.email : undefined };
  } catch {
    return null;
  }
}

async function getUserQuotes(email: string) {
  const cfg = getConnectionConfig();
  const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, company, phone, status, created_at,
            (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) as item_count
       FROM quotes q
      WHERE q.email = ?
      ORDER BY q.created_at DESC
      LIMIT 200`,
    [email]
  );

  await pool.end();
  return rows as {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    status: "NEW" | "REVIEWING" | "SENT" | "CLOSED" | string;
    created_at: string;
    item_count: number;
  }[];
}

export default async function UserQuotesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("fbfood_session")?.value;
  const session = verifySessionToken(sessionToken);

  const email = session?.email;

  if (!email) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
          <h1 className="text-xl font-semibold mb-2">Your quotes</h1>
          <p className="text-sm text-zinc-600 mb-4">You need to be logged in to see your quote history.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400"
          >
            Log in
          </Link>
        </main>
      </div>
    );
  }

  const quotes = await getUserQuotes(email);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 grid gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your quotes</h1>
            <p className="mt-1 text-sm text-zinc-600">Quotes requested using your account email ({email}).</p>
          </div>
          <Link
            href="/user"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            ← Back to dashboard
          </Link>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">Quote history</div>
            <div className="text-xs text-zinc-500">{quotes.length} quote{quotes.length === 1 ? "" : "s"}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Items</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Requested</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-zinc-500">
                      You haven&apos;t submitted any quotes yet.
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => (
                    <tr key={q.id} className="border-t border-zinc-100">
                      <td className="px-3 py-2 font-mono text-xs text-zinc-800">#{q.id}</td>
                      <td className="px-3 py-2 text-zinc-800">{q.item_count}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            q.status === "NEW"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : q.status === "REVIEWING"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : q.status === "SENT"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        {new Date(q.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
