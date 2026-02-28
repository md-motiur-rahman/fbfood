"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    <header className={`sticky top-0 z-50 ${scrolled || open ? "shadow-lg bg-sky-50/95 backdrop-blur-xl border-b border-sky-100" : "bg-sky-50 border-b border-sky-100"} transition-all duration-300`}>
      <div className="container-custom h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 transition-transform hover:scale-105 duration-300">
            <Image
              src="/fbfoodlogo.webp"
              alt="FB Food"
              width={200}
              height={65}
              className="h-16 w-auto object-contain"
              priority
            />
            <span className="font-serif font-bold text-2xl text-slate-800 tracking-tight hidden sm:block">Fine British Foods</span>
          </Link>

          {/* Desktop nav (shown only on large screens) */}
          <nav className="hidden lg:flex items-center justify-between flex-1 px-12 ml-8">
              <div
                className="relative group"
                ref={productsRef}
                onMouseEnter={openProducts}
                onMouseLeave={scheduleCloseProducts}
              >
                <Link
                  href="/items"
                  className={`flex items-center gap-1 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                    productsActive ? "text-sky-700 bg-white shadow-sm shadow-sky-100 ring-1 ring-sky-100" : "text-slate-600 hover:text-sky-700 hover:bg-white/50"
                  }`}
                >
                  Products <span className="text-xs transition-transform duration-200 group-hover:rotate-180 opacity-60">▼</span>
                </Link>
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/50 p-2 transition-all duration-200 origin-top ${productsOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
                  role="menu"
                  onMouseEnter={openProducts}
                  onMouseLeave={scheduleCloseProducts}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-100 rotate-45"></div>
                  <div className="relative bg-white rounded-xl overflow-hidden">
                    <Link href="/items" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">📦</span>
                       All Products
                    </Link>
                    <Link href="/categories" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">📂</span>
                       Categories
                    </Link>
                    <Link href="/brands" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">🏷️</span>
                       Brands
                    </Link>
                    <Link href="/whats-new" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">✨</span>
                       What&apos;s New
                    </Link>
                    <Link href="/top-selling" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">🔥</span>
                       Top Selling
                    </Link>
                  </div>
                </div>
              </div>
              
              <div
                className="relative group ml-2"
                ref={promoRef}
                onMouseEnter={openPromo}
                onMouseLeave={scheduleClosePromo}
              >
                <Link
                  href="#"
                  className={`flex items-center gap-1 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                    activePromo ? "text-sky-700 bg-white shadow-sm shadow-sky-100 ring-1 ring-sky-100" : "text-slate-600 hover:text-sky-700 hover:bg-white/50"
                  }`}
                >
                  Promotions <span className="text-xs transition-transform duration-200 group-hover:rotate-180 opacity-60">▼</span>
                </Link>
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 rounded-2xl border border-sky-100 bg-white shadow-2xl shadow-sky-200/20 p-2 transition-all duration-200 origin-top ${promoOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
                  role="menu"
                  onMouseEnter={openPromo}
                  onMouseLeave={scheduleClosePromo}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-100 rotate-45"></div>
                  <div className="relative bg-white rounded-xl overflow-hidden">
                    <Link href="/promotion/monthly" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">📅</span>
                       Monthly Promotion
                    </Link>
                    <Link href="/promotion/seasonal" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors group/item">
                       <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">🍂</span>
                       Seasonal Promotion
                    </Link>
                  </div>
                </div>
              </div>

              <a
                href="/contact"
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isActive('/contact') ? "text-sky-700 bg-white shadow-sm shadow-sky-100 ring-1 ring-sky-100" : "text-slate-600 hover:text-sky-700 hover:bg-white/50"
                }`}
                aria-current={isActive('/contact') ? "page" : undefined}
              >
                Contact
              </a>
          </nav>

          {/* Desktop search (shown only on large screens) */}
          <form action="/items" method="get" className="hidden xl:flex items-center w-[280px] relative group">
            <label htmlFor="nav-search" className="sr-only">Search</label>
            <div className="flex w-full items-center gap-2 rounded-full bg-white border border-sky-100 px-4 py-2.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-sky-200 focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-md hover:border-sky-200 hover:shadow-sm">
              <span aria-hidden className="text-sky-300 group-focus-within:text-sky-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search products..."
                className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </form>

          {/* Right actions (shown only on large screens) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link href="/quote" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700 hover:bg-sky-50 hover:shadow-md transition-all duration-200 group active:scale-95">
              <span className="group-hover:scale-110 transition-transform duration-200 text-lg">🧾</span>
              <span>Quote</span>
              {totalCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-xs font-bold text-white shadow-sm shadow-sky-200 animate-pulse">{totalCount}</span>
              )}
            </Link>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            {auth?.authenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-600 hover:shadow-md transition-all duration-200 focus:ring-4 focus:ring-sky-50 focus:outline-none active:scale-95"
                >
                  <span className="text-sm font-bold">
                    {computeInitials({ firstName: auth?.firstName ?? null, lastName: auth?.lastName ?? null })}
                  </span>
                </button>
                <div
                  className={`absolute right-0 mt-3 w-64 rounded-2xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5 p-2 transition-all duration-200 origin-top-right ${userMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
                >
                  <div className="px-4 py-3 mb-2 border-b border-slate-50 bg-slate-50/50 rounded-xl">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{auth.email}</p>
                  </div>
                  <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors group">
                    <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">📊</span>
                    Dashboard
                  </a>
                  <a href="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition-colors group">
                    <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">👤</span>
                    Profile
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.assign("/");
                      } catch {}
                    }}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors mt-1 group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">🚪</span>
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/auth/login" className="inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Log in
                </a>
                <a href="/auth/signup" className="inline-flex h-10 items-center justify-center rounded-full bg-sky-500 px-6 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-300 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                  Sign up
                </a>
              </div>
            )}
          </div>

          {/* Mobile/medium toggle */}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm transition-all active:scale-95"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
      )}

      {/* Mobile/medium dropdown */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ height: '100dvh' }}
      >
        <div className="h-full flex flex-col overflow-y-auto">
           {/* Mobile Header with Close Button */}
           <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Image
                  src="/fbfoodlogo.webp"
                  alt="FB Food"
                  width={150}
                  height={50}
                  className="h-12 w-auto object-contain"
                />
                <span className="font-serif font-bold text-xl text-slate-800 tracking-tight">Fine British Foods</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
           </div>

           <div className="container-custom py-6 space-y-6 pb-20">
             {/* Search */}
             <form action="/items" method="get" className="relative">
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                     <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                   </svg>
                 </span>
                 <input
                   name="q"
                   type="search"
                   placeholder="Search products..."
                   className="w-full bg-slate-50 rounded-2xl border border-slate-200 py-4 pl-12 pr-4 text-base outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition-all shadow-inner"
                 />
               </div>
             </form>
   
             {/* Main Navigation */}
             <div className="grid gap-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                    isActive('/') ? "bg-sky-50 text-sky-700 border border-sky-100 shadow-sm" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isActive('/') ? "bg-sky-200 text-sky-800" : "bg-slate-100 text-slate-500"}`}>🏠</span>
                  <span className="font-semibold text-lg">Home</span>
                </Link>
                
                <Link
                  href="/items"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                    isActive('/items') ? "bg-sky-50 text-sky-700 border border-sky-100 shadow-sm" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isActive('/items') ? "bg-sky-200 text-sky-800" : "bg-slate-100 text-slate-500"}`}>📦</span>
                  <span className="font-semibold text-lg">All Products</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                   <Link
                     href="/categories"
                     onClick={() => setOpen(false)}
                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all ${
                       isActive('/categories') ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                     }`}
                   >
                     <span className="text-2xl">📂</span>
                     <span className="font-semibold text-sm">Categories</span>
                   </Link>
                   <Link
                     href="/brands"
                     onClick={() => setOpen(false)}
                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all ${
                       isActive('/brands') ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                     }`}
                   >
                     <span className="text-2xl">🏷️</span>
                     <span className="font-semibold text-sm">Brands</span>
                   </Link>
                   <Link
                     href="/whats-new"
                     onClick={() => setOpen(false)}
                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all ${
                       isActive('/whats-new') ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                     }`}
                   >
                     <span className="text-2xl">✨</span>
                     <span className="font-semibold text-sm">New</span>
                   </Link>
                   <Link
                     href="/top-selling"
                     onClick={() => setOpen(false)}
                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all ${
                       isActive('/top-selling') ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                     }`}
                   >
                     <span className="text-2xl">🔥</span>
                     <span className="font-semibold text-sm">Top Selling</span>
                   </Link>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Promotions</p>
                  <div className="space-y-2">
                    <Link
                      href="/promotion/monthly"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                    >
                      <span className="font-medium text-slate-700">Monthly Deals</span>
                      <span className="text-sky-500">→</span>
                    </Link>
                    <Link
                      href="/promotion/seasonal"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                    >
                      <span className="font-medium text-slate-700">Seasonal Offers</span>
                      <span className="text-sky-500">→</span>
                    </Link>
                  </div>
                </div>
             </div>
             
             {/* User Section */}
             <div className="border-t border-slate-100 pt-6">
               {auth?.authenticated ? (
                 <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-200">
                   <div className="flex items-center gap-4 mb-6">
                     <div className="h-14 w-14 rounded-2xl bg-sky-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-sky-900/50">
                       {computeInitials({ firstName: auth?.firstName ?? null, lastName: auth?.lastName ?? null })}
                     </div>
                     <div className="overflow-hidden">
                       <p className="text-lg font-bold truncate">{auth.firstName || 'User'}</p>
                       <p className="text-sm text-slate-400 truncate">{auth.email}</p>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                      <a href="/admin" onClick={() => setOpen(false)} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <span className="text-2xl mb-1">📊</span>
                        <span className="text-xs font-medium text-slate-300">Dashboard</span>
                      </a>
                      <a href="/profile" onClick={() => setOpen(false)} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <span className="text-2xl mb-1">👤</span>
                        <span className="text-xs font-medium text-slate-300">Profile</span>
                      </a>
                   </div>
                   <button
                     onClick={async () => {
                       try {
                         await fetch("/api/auth/logout", { method: "POST" });
                         setOpen(false);
                         window.location.assign("/");
                       } catch {}
                     }}
                     className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                   >
                     Sign out
                   </button>
                 </div>
               ) : (
                 <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                   <p className="text-center text-slate-600 mb-4 font-medium">Log in to manage your orders</p>
                   <div className="grid gap-3">
                     <a href="/auth/login" onClick={() => setOpen(false)} className="flex items-center justify-center h-12 rounded-xl bg-white border border-slate-200 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                       Log in
                     </a>
                     <a href="/auth/signup" onClick={() => setOpen(false)} className="flex items-center justify-center h-12 rounded-xl bg-sky-500 text-base font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-600 transition-colors">
                       Create Account
                     </a>
                   </div>
                 </div>
               )}
             </div>
             
             {/* Bottom Contact */}
             <div className="pb-6">
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 p-4 w-full rounded-2xl bg-slate-900 text-white font-semibold shadow-xl shadow-slate-200"
                >
                  <span>📞</span> Contact Support
                </Link>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
}
