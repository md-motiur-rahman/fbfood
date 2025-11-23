import { NextRequest, NextResponse } from "next/server";

// Utilities for verifying the HMAC-signed session in middleware (Edge runtime)
function b64urlToUint8Array(b64url: string): Uint8Array {
  const pad = b64url.length % 4 === 2 ? '==' : b64url.length % 4 === 3 ? '=' : '';
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyToken(payloadB64: string, sigB64: string, secret: string): Promise<boolean> {
try {
const keyData = new TextEncoder().encode(secret);
const key = await crypto.subtle.importKey(
'raw',
keyData,
{ name: 'HMAC', hash: 'SHA-256' },
false,
['verify']
);
const sigBytes = b64urlToUint8Array(sigB64);
const payloadBytes = new TextEncoder().encode(payloadB64);
const ok = await crypto.subtle.verify(
'HMAC',
key,
sigBytes as unknown as BufferSource,
payloadBytes as unknown as BufferSource
);
return !!ok;
} catch {
return false;
}
}

async function getSessionPayload(req: NextRequest): Promise<{ id: number; email: string; role: string } | null> {
  const token = req.cookies.get('fbfood_session')?.value;
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const secret = process.env.AUTH_SECRET || 'dev-secret';
  const ok = await verifyToken(payloadB64, sigB64, secret);
  if (!ok) return null;
  try {
    const json = new TextDecoder().decode(b64urlToUint8Array(payloadB64));
    const data = JSON.parse(json);
    if (typeof data?.id === 'number' && typeof data?.email === 'string' && typeof data?.role === 'string') {
      return { id: data.id, email: data.email, role: data.role };
    }
    return null;
  } catch {
    return null;
  }
}

function adminSetupLocked(req: NextRequest): boolean {
  return req.cookies.get('fbfood_admin_exists')?.value === '1';
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  const payload = await getSessionPayload(req);
  const authed = !!payload;
  const isAdmin = payload?.role === 'ADMIN';

  // If logged in, prevent visiting login/signup
  if (authed && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Secret admin setup: allow only if no admin exists (flag via cookie). If admin exists, block/redirect.
  if (pathname.startsWith('/auth/admin/setup')) {
    if (adminSetupLocked(req)) {
      const dest = new URL('/auth/login', req.url);
      dest.searchParams.set('error', 'Admin already exists. Please sign in.');
      return NextResponse.redirect(dest);
    }
    return NextResponse.next();
  }

  // Admin-only dashboard and routes under /admin
  if (pathname.startsWith('/admin')) {
    if (!authed) {
      const dest = new URL('/auth/login', req.url);
      dest.searchParams.set('error', 'Please log in to continue.');
      return NextResponse.redirect(dest);
    }
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return NextResponse.next();
  }

  // Protect dashboard and profile routes for any authenticated user
  if (!authed && (pathname.startsWith('/dashboard') || pathname.startsWith('/profile'))) {
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('error', 'Please log in to continue.');
      return NextResponse.redirect(loginUrl);
    }
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Restrict logout API to authenticated users only
  if (pathname === '/api/auth/logout' && !authed) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/auth/admin/setup',
    '/auth/login',
    '/auth/signup',
    '/api/auth/logout',
  ],
};
