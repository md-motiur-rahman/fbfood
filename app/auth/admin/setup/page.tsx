import bcrypt from "bcrypt";
import mysql, { type Pool, type PoolOptions, type RowDataPacket } from "mysql2/promise";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

// Simple pool cache across hot-reloads in dev
const globalForDb = global as unknown as { __dbPool?: Pool };

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

function getPool(): Pool {
  if (!globalForDb.__dbPool) {
    const cfg = getConnectionConfig();
    globalForDb.__dbPool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
  }
  return globalForDb.__dbPool!;
}

async function adminExists(): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  return rows.length > 0;
}

export default async function AdminSetupPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  if (await adminExists()) {
    redirect("/auth/login?error=" + encodeURIComponent("Admin already exists. Please sign in."));
  }

  async function createAdmin(formData: FormData) {
    "use server";

    // Guard: if admin already exists, do not proceed
    if (await adminExists()) {
      redirect("/auth/login?error=" + encodeURIComponent("Admin already exists. Please sign in."));
    }

    const first_name = (formData.get("first_name") || "").toString().trim();
    const last_name = (formData.get("last_name") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim().toLowerCase();
    const password = (formData.get("password") || "").toString();
    const confirm = (formData.get("confirm_password") || "").toString();

    const isValidEmail = (e: string) => /.+@.+\..+/.test(e);

    if (!email || !isValidEmail(email)) {
      redirect("/auth/admin/setup?error=" + encodeURIComponent("Please provide a valid email address."));
    }
    if (!password || password.length < 8) {
      redirect("/auth/admin/setup?error=" + encodeURIComponent("Password must be at least 8 characters."));
    }
    if (password !== confirm) {
      redirect("/auth/admin/setup?error=" + encodeURIComponent("Passwords do not match."));
    }

    try {
      const pool = getPool();
      // Double-check unique email
      const [dup] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
      if (dup.length > 0) {
        redirect("/auth/admin/setup?error=" + encodeURIComponent("Email is already registered."));
      }

      const saltRounds = Number(process.env.SALT_ARGUMENT || 10);
      const password_hash = await bcrypt.hash(password, saltRounds);

      await pool.execute(
        "INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES (?, ?, 'ADMIN', ?, ?, ?)",
        [email, password_hash, first_name || null, last_name || null, phone || null]
      );
    } catch (err) {
      console.error("Admin setup error:", err);
      // Unique admin constraint or other DB error
      redirect("/auth/admin/setup?error=" + encodeURIComponent("Failed to create admin. If an admin exists, please sign in."));
    }

    redirect("/auth/login?signup=success");
  }

  const sp = await searchParams;
  const error = sp?.error as string | undefined;
  const success = sp?.success as string | undefined;

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="mx-auto max-w-md px-4 py-10 text-slate-900">
        <h1 className="text-2xl font-bold mb-6">Admin setup</h1>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 mb-4">
          Keep this route secret. It should only be used once to create the first admin.
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <form action={createAdmin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="first_name">First name</label>
              <input id="first_name" name="first_name" type="text" className="w-full rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="last_name">Last name</label>
              <input id="last_name" name="last_name" type="text" className="w-full rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" className="w-full rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="w-full rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required className="w-full rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"/>
            <p className="mt-1 text-xs text-slate-600">Minimum 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm_password">Confirm password</label>
            <input id="confirm_password" name="confirm_password" type="password" required className="w-full rounded border border-sky-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"/>
          </div>

          <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-semibold text-slate-900 shadow hover:bg-sky-400">
            Create admin
          </button>
        </form>
      </div>
    </div>
  );
}
