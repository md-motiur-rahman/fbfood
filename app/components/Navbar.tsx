"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuote } from "./quote/QuoteContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [auth, setAuth] = useState<{ authenticated: boolean; role?: string; email?: string; firstName?: string | null; lastName?: string | null } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const promoRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const productsCloseTimer = useRef<number | null>(null);

  const openProducts = () => {
    if (productsCloseTimer.current) {
      clearTimeout(productsCloseTimer.current);
      productsCloseTimer.current = null;
    }
    setProductsOpen(true);
  };
  const scheduleCloseProducts = () => {
    if (productsCloseTimer.current) clearTimeout(productsCloseTimer.current);
    productsCloseTimer.current = window.setTimeout(() => {
      setProductsOpen(false);
      productsCloseTimer.current = null;
    }, 250);
  };

  const promoCloseTimer = useRef<number | null>(null);
  const openPromo = () => {
    if (promoCloseTimer.current) {
      clearTimeout(promoCloseTimer.current);
      promoCloseTimer.current = null;
    }
    setPromoOpen(true);
  };
  const scheduleClosePromo = () => {
    if (promoCloseTimer.current) clearTimeout(promoCloseTimer.current);
    promoCloseTimer.current = window.setTimeout(() => {
      setPromoOpen(false);
      promoCloseTimer.current = null;
    }, 250);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    // fetch auth state
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAuth({ authenticated: !!data?.authenticated, role: data?.user?.role, email: data?.user?.email, firstName: data?.user?.firstName, lastName: data?.user?.lastName }))
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (promoRef.current && !promoRef.current.contains(e.target as Node)) {
        setPromoOpen(false);
      }
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  type UserName = { firstName?: string | null; lastName?: string | null };
  const computeInitials = (info: UserName | null) => {
    if (!info) return "U";
    const f = info.firstName;
    const l = info.lastName;
    const a = (f?.trim()?.[0] || "").toUpperCase();
    const b = (l?.trim()?.[0] || "").toUpperCase();
    return (a + b) || (a || b) || "U";
  };

  const pathname = usePathname();
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  const activePromo = isActive('/promotion/monthly') || isActive('/promotion/seasonal');
  const productsActive = isActive('/items') || isActive('/categories') || isActive('/brands') || isActive('/whats-new') || isActive('/top-selling');
  const isHome = pathname === '/';
  const { totalCount } = useQuote();

  return (
    <header className={`sticky top-0 z-50 ${scrolled || open ? "shadow-sm" : ""}`}>
      <div className={`${isHome ? 'border-b-0' : 'border-b border-amber-300'} bg-amber-100/90 backdrop-blur transition-colors`}>
        <div className="mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2 md:gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-grid h-8 w-8 place-items-center rounded bg-amber-500 text-zinc-900 font-bold shadow-sm">FB</span>
            <span className="text-base sm:text-lg font-semibold tracking-tight">FBFOOD</span>
          </Link>

          {/* Desktop nav (shown only on large screens) */}
          <nav className="hidden lg:flex items-center whitespace-nowrap flex-1 min-w-0">
            <div className="flex items-center gap-1 overflow-visible flex-wrap md:flex-nowrap">
              <Link
                href="/"
                className={`inline-flex items-center whitespace-nowrap shrink-0 px-3 py-2 text-[15px] font-medium border-b-2 ${
                  isActive('/') ? "text-zinc-900 border-amber-500" : "text-zinc-700 border-transparent hover:text-amber-700 hover:border-amber-500"
                }`}
                aria-current={isActive('/') ? "page" : undefined}
              >
                Home
              </Link>
              <div
                className="relative inline-flex shrink-0"
                ref={productsRef}
                onMouseEnter={openProducts}
                onMouseLeave={scheduleCloseProducts}
              >
                <Link
                  href="/items"
                  className={`inline-flex items-center whitespace-nowrap shrink-0 px-3 py-2 text-[15px] font-medium border-b-2 ${
                    productsActive ? "text-zinc-900 border-amber-500" : "text-zinc-700 border-transparent hover:text-amber-700 hover:border-amber-500"
                  }`}
                >
                  Products ▾
                </Link>
                <div
                  className={`absolute left-0 top-full mt-1 w-72 max-h-[70vh] overflow-y-auto rounded-md border border-amber-200 bg-white shadow-lg z-50 ${productsOpen ? "block" : "hidden"}`}
                  role="menu"
                  onMouseEnter={openProducts}
                  onMouseLeave={scheduleCloseProducts}
                >
                  <Link href="/items" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">All Products</Link>
                  <Link href="/categories" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">Categories</Link>
                  <Link href="/brands" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">Brands</Link>
                  <Link href="/whats-new" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">What&apos;s New</Link>
                  <Link href="/top-selling" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">Top Selling</Link>
                </div>
              </div>
              {/* Promotion dropdown inside main order */}
              <div
                className="relative inline-flex shrink-0 ml-1"
                ref={promoRef}
                onMouseEnter={openPromo}
                onMouseLeave={scheduleClosePromo}
              >
                <Link
                  href="#"
                  className={`inline-flex items-center whitespace-nowrap shrink-0 px-3 py-2 text-[15px] font-medium border-b-2 ${
                    activePromo ? "text-zinc-900 border-amber-500" : "text-zinc-700 border-transparent hover:text-amber-700 hover:border-amber-500"
                  }`}
                >
                  Promotions ▾
                </Link>
                <div
                  className={`absolute right-0 top-full mt-1 w-72 max-h-[70vh] overflow-y-auto rounded-md border border-amber-200 bg-white shadow-lg z-50 ${promoOpen ? "block" : "hidden"}`}
                  role="menu"
                  onMouseEnter={openPromo}
                  onMouseLeave={scheduleClosePromo}
                >
                  <Link href="/promotion/monthly" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">Monthly Promotion</Link>
                  <Link href="/promotion/seasonal" className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50" role="menuitem">Seasonal Promotion</Link>
                </div>
              </div>
              {/* Contact and FAQs */}
              <a
                href="/contact"
                className={`inline-flex items-center whitespace-nowrap shrink-0 px-3 py-2 text-[15px] font-medium border-b-2 ${
                  isActive('/contact') ? "text-zinc-900 border-amber-500" : "text-zinc-700 border-transparent hover:text-amber-700 hover:border-amber-500"
                }`}
                aria-current={isActive('/contact') ? "page" : undefined}
              >
                Contact
              </a>
              <a
                href="/faqs"
                className={`inline-flex items-center whitespace-nowrap shrink-0 px-3 py-2 text-[15px] font-medium border-b-2 ${
                  isActive('/faqs') ? "text-zinc-900 border-amber-500" : "text-zinc-700 border-transparent hover:text-amber-700 hover:border-amber-500"
                }`}
                aria-current={isActive('/faqs') ? "page" : undefined}
              >
                FAQ&apos;s
              </a>
            </div>
          </nav>

          {/* Desktop search (shown only on large screens) */}
          <form action="/items" method="get" className="hidden lg:flex items-center gap-2 mx-2 md:mx-3 w-[260px] md:w-[420px] lg:w-[520px] flex-none">
            <label htmlFor="nav-search" className="sr-only">Search</label>
            <div className="flex w-full items-center gap-2 rounded-full bg-white ring-1 ring-black/10 px-4 py-2">
              <span aria-hidden className="text-amber-700">🔎</span>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search products, categories, brands, barcodes..."
                className="w-full bg-transparent outline-none text-base placeholder:text-zinc-500"
              />
            </div>
          </form>

          {/* Right actions (shown only on large screens) */}
          <div className="hidden lg:flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
            <Link href="/quote" className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-amber-50">
              <span aria-hidden>🧾</span>
              <span>Quote</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-zinc-900">{totalCount}</span>
            </Link>
            {auth?.authenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-white text-zinc-800"
                >
                  <span className="text-sm font-semibold">
                    {computeInitials({ firstName: auth?.firstName ?? null, lastName: auth?.lastName ?? null })}
                  </span>
                </button>
                <div
                  className={`absolute right-0 mt-2 w-44 rounded-md border border-amber-200 bg-white shadow ${userMenuOpen ? "block" : "hidden"}`}
                >
                  <a href="/admin" className="block px-3 py-2 text-sm text-zinc-800 hover:bg-amber-50">Dashboard</a>
                  <a href="/profile" className="block px-3 py-2 text-sm text-zinc-800 hover:bg-amber-50">Profile</a>
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.assign("/");
                      } catch {}
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-zinc-800 hover:bg-amber-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <a href="/auth/login" className="inline-flex h-9 items-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50">
                  Login
                </a>
                <a href="/auth/signup" className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
                  Sign up
                </a>
              </>
            )}
          </div>

          {/* Mobile/medium toggle */}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden grid h-10 w-10 place-items-center rounded border border-black/10 text-zinc-900"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile/medium dropdown */}
      <div
        className={`lg:hidden absolute left-0 right-0 z-50 origin-top border-b border-amber-200 bg-amber-50/95 transition-all ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav className="mx-auto w-full px-4 sm:px-6 py-2 grid">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/') ? "page" : undefined}
          >
            Home
          </Link>
          <div className="mt-2 mb-1 px-2 text-xs font-semibold uppercase text-zinc-600">Products</div>
          <Link
            href="/items"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/items') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/items') ? "page" : undefined}
          >
            All Products
          </Link>
          <Link
            href="/categories"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/categories') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/categories') ? "page" : undefined}
          >
            Categories
          </Link>
          <Link
            href="/brands"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/brands') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/brands') ? "page" : undefined}
          >
            Brands
          </Link>
          <a
            href="/whats-new"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/whats-new') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/whats-new') ? "page" : undefined}
          >
            What&apos;s New
          </a>
          <a
            href="/top-selling"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/top-selling') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/top-selling') ? "page" : undefined}
          >
            Top Selling
          </a>
          <a
            href="/promotion/monthly"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/promotion/monthly') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/promotion/monthly') ? "page" : undefined}
          >
            Monthly Promotion
          </a>
          <a
            href="/promotion/seasonal"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/promotion/seasonal') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/promotion/seasonal') ? "page" : undefined}
          >
            Seasonal Promotion
          </a>
          <a
            href="/contact"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/contact') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/contact') ? "page" : undefined}
          >
            Contact
          </a>
          <a
            href="/faqs"
            onClick={() => setOpen(false)}
            className={`py-3 px-2 text-sm font-medium rounded ${
              isActive('/faqs') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
            }`}
            aria-current={isActive('/faqs') ? "page" : undefined}
          >
            FAQ&apos;s
          </a>
          {auth?.authenticated && auth.role === 'ADMIN' && (
            <a
              href="/admin"
              onClick={() => setOpen(false)}
              className={`py-3 px-2 text-sm font-medium rounded ${
                isActive('/admin') ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
              }`}
              aria-current={isActive('/admin') ? "page" : undefined}
            >
              Dashboard
            </a>
          )}
          <div className="py-2 grid gap-2">
            {auth?.authenticated ? (
              <>
                <a href="/admin" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50">
                  Dashboard
                </a>
                <a href="/profile" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50">
                  Profile
                </a>
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      setOpen(false);
                      window.location.assign("/");
                    } catch {}
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/auth/login" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50">
                  Login
                </a>
                <a href="/auth/signup" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
                  Sign up
                </a>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile/medium search bar */}
      <div className="lg:hidden border-b border-amber-200 bg-amber-50/90">
        <div className="mx-auto w-full px-4 sm:px-6 py-2">
          <form action="/items" method="get" className="flex items-center gap-2">
            <label htmlFor="nav-search-mobile" className="sr-only">Search</label>
            <div className="flex w-full items-center gap-2 rounded-full bg-white ring-1 ring-black/10 px-4 py-3">
              <span aria-hidden className="text-amber-700">🔎</span>
              <input
                id="nav-search-mobile"
                name="q"
                type="search"
                placeholder="Search products, categories, brands..."
                className="w-full bg-transparent outline-none text-base placeholder:text-zinc-500"
              />
            </div>
            <button type="submit" className="sr-only">Search</button>
          </form>
        </div>
      </div>
    </header>
  );
}
