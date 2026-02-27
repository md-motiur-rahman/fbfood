"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

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
  if (!user) return "A";
  const a = (user.firstName?.trim()?.[0] || "").toUpperCase();
  const b = (user.lastName?.trim()?.[0] || "").toUpperCase();
  return (a + b) || a || b || "A";
}

function NavItem({ href, label, icon, onNavigate, collapsed }: { href: string; label: string; icon: React.ReactNode; onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const active = href === "/admin"
    ? pathname === "/admin"
    : (pathname === href || pathname.startsWith(href + "/"));
  
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" 
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <span className={`${active ? "text-white" : "text-slate-500 group-hover:text-white"} transition-colors flex-shrink-0`}>
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

const Icons = {
  Dashboard: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Products: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Categories: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  Brands: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Carousel: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Quotes: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Promotions: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  Logout: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Profile: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Menu: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen size
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: MeResponse) => setMe(d))
      .catch(() => setMe(null));

    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/auth/login");
    } catch {}
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-sky-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Desktop Access Only</h1>
        <p className="text-slate-400 max-w-sm mx-auto mb-8">
          The Admin Dashboard is optimized for larger screens to ensure the best management experience. Please access it from a PC or laptop.
        </p>
        <Link 
          href="/"
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/10"
        >
          Return to Website
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col z-50 flex-shrink-0 ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className={`h-20 flex items-center border-b border-white/10 ${collapsed ? "justify-center px-0" : "px-6"} transition-all duration-300`}>
            <Link href="/" className="flex items-center gap-3 group">
              {collapsed ? (
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sky-600 font-bold text-xl shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden p-1">
                    <Image src="/logo.png" alt="FB" width={40} height={40} className="w-full h-full object-contain" />
                 </div>
              ) : (
                 <div className="flex items-center gap-3 transition-opacity duration-300">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden p-1">
                       <Image src="/logo.png" alt="FB" width={40} height={40} className="w-full h-full object-contain" />
                    </div>
                    <div>
                       <h1 className="font-bold text-lg leading-tight text-white">FB Food</h1>
                       <p className="text-xs text-slate-400">Admin Portal</p>
                    </div>
                 </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
            {!collapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-6">Overview</div>}
            <div className={collapsed ? "px-3 text-center" : "px-4"}>
              <NavItem href="/admin" label="Dashboard" icon={Icons.Dashboard} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
            </div>
            
            {!collapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-6">Management</div>}
            <div className={collapsed ? "px-3 space-y-1 text-center mt-4" : "px-4 space-y-1"}>
              <NavItem href="/admin/products" label="Products" icon={Icons.Products} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
              <NavItem href="/admin/categories" label="Categories" icon={Icons.Categories} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
              <NavItem href="/admin/brands" label="Brands" icon={Icons.Brands} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
              <NavItem href="/admin/quotes" label="Quotes" icon={Icons.Quotes} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
            </div>
            
            {!collapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-6">Marketing</div>}
            <div className={collapsed ? "px-3 space-y-1 text-center mt-4" : "px-4 space-y-1"}>
              <NavItem href="/admin/carousel" label="Carousel" icon={Icons.Carousel} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
              <NavItem href="/admin/promotion" label="Promotions" icon={Icons.Promotions} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10 bg-slate-800/50">
            <div className={`flex items-center gap-3 mb-4 ${collapsed ? "justify-center px-0" : "px-2"}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                {computeInitials(me?.user ?? undefined)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 transition-opacity duration-300">
                  <p className="text-sm font-medium text-white truncate">
                    {me?.user?.firstName || "Administrator"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {me?.user?.email}
                  </p>
                </div>
              )}
            </div>
            <div className={`grid gap-2 ${collapsed ? "grid-cols-1" : "grid-cols-2"}`}>
              <Link 
                href="/profile" 
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors ${collapsed ? "w-full" : ""}`}
                title="Profile"
              >
                {Icons.Profile} {!collapsed && "Profile"}
              </Link>
              <button 
                onClick={onLogout}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 hover:text-red-300 transition-colors ${collapsed ? "w-full" : ""}`}
                title="Logout"
              >
                {Icons.Logout} {!collapsed && "Logout"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
               {collapsed ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
               ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
               )}
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              Welcome back, {me?.user?.firstName || "Admin"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                System Operational
             </div>
             <Link href="/" target="_blank" className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
                View Site 
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Global Style Override */}
      <style jsx global>{`
        footer { display: none !important; }
      `}</style>
    </div>
  );
}
