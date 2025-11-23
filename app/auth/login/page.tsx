import bcrypt from "bcrypt";
import mysql, { type Pool, type PoolOptions, type RowDataPacket } from "mysql2/promise";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

export const runtime = "nodejs"; // ensure Node.js runtime for MySQL

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

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function signSession(data: Record<string, unknown>): string {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: "ADMIN" | "EDITOR" | "USER";
  status: "ACTIVE" | "SUSPENDED";
  first_name: string | null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; signup?: string }> }) {
  async function login(formData: FormData) {
    "use server";

    const email = (formData.get("email") || "").toString().trim().toLowerCase();
    const password = (formData.get("password") || "").toString();

    if (!email || !isValidEmail(email)) {
      redirect("/auth/login?error=" + encodeURIComponent("Please provide a valid email address."));
    }
    if (!password) {
      redirect("/auth/login?error=" + encodeURIComponent("Please provide your password."));
    }

    // Fetch user with a narrow try/catch so redirect exceptions don't get captured
    let rows: UserRow[];
    try {
      const pool = getPool();
      const [r] = await pool.query<UserRow[]>(
        "SELECT id, email, password_hash, role, status, first_name FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      rows = r;
    } catch (err: unknown) {
      console.error("Login error:", err);
      const code = (err as { code?: string })?.code;
      const msg = code ? `Login failed. (code: ${code})` : "Login failed.";
      redirect("/auth/login?error=" + encodeURIComponent(msg));
    }

    if (rows.length === 0) {
      redirect("/auth/login?error=" + encodeURIComponent("Invalid email or password."));
    }

    const user = rows[0];
    if (user.status !== "ACTIVE") {
      redirect("/auth/login?error=" + encodeURIComponent("Your account is not active."));
    }

    let ok: boolean;
    try {
      ok = await bcrypt.compare(password, user.password_hash);
    } catch (err: unknown) {
      console.error("Login error:", err);
      redirect("/auth/login?error=" + encodeURIComponent("Login failed."));
    }
    if (!ok) {
      redirect("/auth/login?error=" + encodeURIComponent("Invalid email or password."));
    }

    // Issue session cookie
    const token = signSession({ id: user.id, role: user.role, email: user.email });
    const secure = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    cookieStore.set("fbfood_session", token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // If admin, redirect to admin dashboard and set a flag cookie to lock setup route
    if (user.role === "ADMIN") {
      cookieStore.set("fbfood_admin_exists", "1", {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      redirect("/admin");
    } else {
      // Non-admin users land on the user dashboard
      redirect("/user");
    }
  }

  const sp = await searchParams;
  const error = sp?.error as string | undefined;
  const signup = sp?.signup as string | undefined;

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-md px-4 py-10 text-zinc-900">
        <h1 className="text-2xl font-bold mb-6">Log in to your account</h1>

        <div className="rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
          {signup === "success" && (
            <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Account created successfully. You can log in now.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="w-full rounded border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="w-full rounded border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"/>
            </div>

            <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
              Log in
            </button>
          </form>
        </div>

        <p className="mt-4 text-sm text-zinc-700">
          Don't have an account? <a className="text-amber-700 hover:underline" href="/auth/signup">Create one</a>
        </p>
      </div>
    </div>
  );
}
