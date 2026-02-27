import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { redirect } from "next/navigation";

export const runtime = "nodejs"; // ensure Node.js runtime for MySQL

// Simple pool cache across hot-reloads in dev
const globalForDb = global as unknown as { __dbPool?: mysql.Pool };

function getConnectionConfig(): mysql.PoolOptions {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const sslEnabled = String(process.env.DATABASE_SSL || "").toLowerCase() === "true" || String(process.env.DATABASE_SSL || "") === "1";
  const rejectUnauth = !(String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "").toLowerCase() === "false" || String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "") === "0");

  if (rawUrl) {
    // Strip surrounding quotes if any
    const cleaned = rawUrl.replace(/^\"|\"$/g, "").replace(/^'|'$/g, "");
    try {
      const u = new URL(cleaned);
      const cfg: mysql.PoolOptions = {
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
        cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as any;
      }
      return cfg;
    } catch (e) {
      // Fallback to passing string if URL parsing fails
      return { uri: cleaned } as any;
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
  const cfg: mysql.PoolOptions = {
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
    cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as any;
  }
  return cfg;
}

function getPool() {
  if (!globalForDb.__dbPool) {
    const cfg = getConnectionConfig();
    globalForDb.__dbPool = mysql.createPool(cfg as any);
  }
  return globalForDb.__dbPool!;
}

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

async function emailExists(email: string) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  // rows typed as any[]
  if (Array.isArray(rows) && rows.length > 0) return true;
  return false;
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  async function signup(formData: FormData) {
    "use server";

    const first_name = (formData.get("first_name") || "").toString().trim();
    const last_name = (formData.get("last_name") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim().toLowerCase();
    const password = (formData.get("password") || "").toString();
    const confirm = (formData.get("confirm_password") || "").toString();

    // Basic validation
    if (!email || !isValidEmail(email)) {
      return redirect("/auth/signup?error=" + encodeURIComponent("Please provide a valid email address."));
    }
    if (!password || password.length < 8) {
      return redirect("/auth/signup?error=" + encodeURIComponent("Password must be at least 8 characters."));
    }
    if (password !== confirm) {
      return redirect("/auth/signup?error=" + encodeURIComponent("Passwords do not match."));
    }

    // Check for existing email outside try/catch to avoid capturing Next.js redirect exception
    if (await emailExists(email)) {
      redirect("/auth/signup?error=" + encodeURIComponent("Email is already registered."));
    }

    try {
      const saltRounds = Number(process.env.SALT_ARGUMENT || 10);
      const password_hash = await bcrypt.hash(password, saltRounds);

      const pool = getPool();
      await pool.execute(
        "INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES (?, ?, 'USER', ?, ?, ?)",
        [email, password_hash, first_name || null, last_name || null, phone || null]
      );
    } catch (err: any) {
      // Log server-side for debugging and include error code in redirect to assist troubleshooting
      console.error("Signup error:", err);
      const msg = err?.code === "ER_DUP_ENTRY"
        ? "Email is already registered."
        : `Failed to create account. Please try again. (code: ${err?.code || "UNKNOWN"})`;
      redirect("/auth/signup?error=" + encodeURIComponent(msg));
    }

    redirect("/auth/login?signup=success");
  }

  const sp = await searchParams;
  const error = sp?.error as string | undefined;
  const success = sp?.success as string | undefined;

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="mx-auto max-w-md px-4 py-10 text-slate-900">
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>

        <div className="rounded-lg border border-sky-200 bg-white p-6 shadow-sm">
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

          <form action={signup} className="space-y-4">
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
              Create account
            </button>
          </form>
        </div>

        <p className="mt-4 text-sm text-slate-700">
          Already have an account? <a className="text-sky-700 hover:underline" href="/auth/login">Log in</a>
        </p>
      </div>
    </div>
  );
}
