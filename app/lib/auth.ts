import { createHmac, timingSafeEqual } from "crypto";

export type SessionPayload = {
  id: number;
  email: string;
  role: "ADMIN" | "EDITOR" | "USER";
};

function getSecret() {
  return process.env.AUTH_SECRET || "dev-secret";
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  try {
    const expected = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
    const a = Buffer.from(sigB64);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;

    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.id !== "number" || typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    } as SessionPayload;
  } catch {
    return null;
  }
}
