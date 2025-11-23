import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/app/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fbfood_session")?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null as null;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };
  return map[mime] || "";
}

export async function POST(req: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const form = await req.formData();
  const file = form.get("image") as unknown as File | null;
  if (!file) return NextResponse.json({ error: "Missing image file" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type || "application/octet-stream";
  const size = buffer.length;
  let ext = path.extname((file as any).name || "") || extFromMime(mime) || "";
  if (!ext && mime.startsWith("image/")) ext = ".bin";

  const baseDir = path.join(process.cwd(), "public", "uploads", "carousel");
  await fs.mkdir(baseDir, { recursive: true });

  const name = crypto.randomBytes(8).toString("hex") + "_" + Date.now() + ext.toLowerCase();
  const absPath = path.join(baseDir, name);
  await fs.writeFile(absPath, buffer);

  const publicPath = "/uploads/carousel/" + name;

  return NextResponse.json({
    ok: true,
    path: publicPath,
    key: publicPath,
    mime_type: mime,
    size_bytes: size,
    width: null,
    height: null,
  });
}
