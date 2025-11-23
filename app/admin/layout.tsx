"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MeResponse = {
  authenticated: boolean;
  user: {
    id: number;
    email: string;
    role: "ADMIN" | "EDITOR" | "USER";
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

function computeInitials(user?: { firstName?: string | null; lastName?: string | null }): string {
  if (!user) return "U";
  const a = (user.firstName?.trim()?.[0] || "").toUpperCase();
  const b = (user.lastName?.trim()?.[0] || "").toUpperCase();
  return (a + b) || a || b || "U";
}

function NavItem({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = href === "/admin"
    ? pathname === "/admin"
    : (pathname === href || pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium ${
        active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: MeResponse) => setMe(d))
      .catch(() => setMe(null));
  }, []);

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/auth/login");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 backdrop-blur px-4">
        <button
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
          className="grid h-9 w-9 place-items-center rounded border border-black/10"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-grid h-8 w-8 place-items-center rounded bg-amber-500 text-zinc-900 font-bold shadow-sm">FB</span>
          <span className="text-base font-semibold tracking-tight">Admin</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex min-h-[calc(100vh-3.5rem)] md:h-screen">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col overflow-y-auto text-white`}
          style={{ backgroundColor: "#0b223d" }}
        >
          <div className="hidden md:flex h-14 items-center gap-2 px-4 border-b border-white/10">
            <span className="inline-grid h-8 w-8 place-items-center rounded bg-amber-500 text-zinc-900 font-bold shadow-sm">FB</span>
            <span className="text-base font-semibold tracking-tight">Admin</span>
          </div>

          <nav className="p-3 grid gap-1 overflow-y-auto">
            <div className="text-xs uppercase tracking-wide text-white/60 px-2">Manage</div>
            <NavItem href="/admin" label="Dashboard" onNavigate={() => setSidebarOpen(false)} />
            <NavItem href="/admin/products" label="Products" onNavigate={() => setSidebarOpen(false)} />
            <NavItem href="/admin/categories" label="Categories" onNavigate={() => setSidebarOpen(false)} />
            <NavItem href="/admin/brands" label="Brands" onNavigate={() => setSidebarOpen(false)} />
            <NavItem href="/admin/carousel" label="Carousel" onNavigate={() => setSidebarOpen(false)} />
            <NavItem href="/admin/quotes" label="Quotes" onNavigate={() => setSidebarOpen(false)} />
            <NavItem href="/admin/promotion" label="Promotions" onNavigate={() => setSidebarOpen(false)} />
          </nav>

          <div className="mt-auto p-3">
            <div className="h-px bg-white/10 mb-3" />
            <div className="flex items-center gap-3 px-2 py-2 rounded">
              <div className="inline-grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-transparent text-sm font-semibold text-white">
                {computeInitials(me?.user ?? undefined)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate text-white">{me?.user?.firstName || me?.user?.email?.split("@")[0] || "Admin"}</div>
                <div className="text-xs text-white/70 truncate">{me?.user?.email || "admin"}</div>
              </div>
            </div>
            <div className="grid gap-2">
              <Link href="/profile" onClick={() => setSidebarOpen(false)} className="inline-flex items-center justify-center rounded border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10">
                Profile
              </Link>
              <button onClick={onLogout} className="inline-flex items-center justify-center rounded border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10">
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 md:h-screen md:overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Hide global footer for admin pages */}
      <style jsx global>{`
        footer { display: none !important; }
      `}</style>
    </div>
  );
}
