"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/items", label: "All Items" },
  { href: "/whats-new", label: "What's New" },
  { href: "/top-selling", label: "Top Sellings" },
  { href: "/promotion", label: "Promotion" },
  { href: "/contact", label: "Contact" },
  { href: "/faqs", label: "FAQ's" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const pathname = usePathname();
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className={`sticky top-0 z-50 ${scrolled || open ? "shadow-sm" : ""}`}>
      <div className={`border-b border-amber-200 bg-amber-50/90 backdrop-blur transition-colors`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-grid h-8 w-8 place-items-center rounded bg-amber-500 text-zinc-900 font-bold shadow-sm">FB</span>
            <span className="text-base font-semibold tracking-tight">FBFOOD</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                    active
                      ? "text-zinc-900 border-amber-500"
                      : "text-zinc-700 border-transparent hover:text-amber-700 hover:border-amber-500"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/contact" className="inline-flex h-9 items-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50">
              Get a Quote
            </a>
            <a href="/items" className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
              Shop
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden grid h-10 w-10 place-items-center rounded border border-black/10 text-zinc-900"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile dropdown */}
      <div
        className={`md:hidden absolute left-0 right-0 z-50 origin-top border-b border-amber-200 bg-amber-50/95 transition-all ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-2 grid">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-3 px-2 text-sm font-medium rounded ${
                  active ? "bg-amber-100 text-zinc-900" : "text-zinc-800 hover:bg-amber-50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </a>
            );
          })}
          <div className="py-2 flex items-center gap-2">
            <a href="/contact" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-amber-200 px-4 text-sm font-medium hover:bg-amber-50">
              Get a Quote
            </a>
            <a href="/items" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-900 shadow hover:bg-amber-400">
              Shop
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
