import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/app/lib/auth";
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
        connectionLimit: 5,
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
    connectionLimit: 5,
    queueLimit: 0,
  };
  if (sslEnabled) {
    cfg.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: rejectUnauth } as unknown as PoolOptions["ssl"];
  }
  return cfg;
}

interface NameRow extends RowDataPacket {
  id: number;
  email: string;
  role: "ADMIN" | "EDITOR" | "USER";
  first_name: string | null;
  last_name: string | null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fbfood_session")?.value;
    const payload = verifySessionToken(token);
    if (!payload) return NextResponse.json({ authenticated: false, user: null });

    // Fetch names from DB for accurate initials
    let userInfo: NameRow | null = null;
    try {
      const cfg = getConnectionConfig();
      const pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
      const [rows] = await pool.query<NameRow[]>(
        "SELECT id, email, role, first_name, last_name FROM users WHERE id = ? LIMIT 1",
        [payload.id]
      );
      await pool.end();
      userInfo = rows.length > 0 ? rows[0] : null;
    } catch {
      // If DB fetch fails, fall back to token payload
    }

    const user = userInfo
      ? {
          id: userInfo.id,
          email: userInfo.email,
          role: userInfo.role,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
        }
      : {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          firstName: null,
          lastName: null,
        };

    return NextResponse.json({ authenticated: true, user });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
