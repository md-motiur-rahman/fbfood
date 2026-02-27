"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuotesTrendChart, TopProductsBarChart, type QuoteTrendPoint, type TopProduct } from "./QuotesChartsClient";

type DashboardData = {
  quotes: { total_quotes: number; quotes_7d: number };
  users: { total_users: number; users_7d: number };
  quoteTrend: QuoteTrendPoint[];
  topProducts: TopProduct[];
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000); // Minimum visual feedback
  };

  const { quotes, users, quoteTrend, topProducts } = data;
  
  const quoteTrendData = quoteTrend.map((pt) => ({
    label: pt.label,
    count: pt.count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-slate-500">Real-time insights and performance metrics.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm ${refreshing ? "opacity-70 cursor-wait" : "hover:shadow-md"}`}
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quotes KPI */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <svg className="w-32 h-32 text-sky-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600 shadow-sm border border-sky-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${quotes.quotes_7d > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {quotes.quotes_7d > 0 ? `+${quotes.quotes_7d} this week` : "No new quotes"}
                 </span>
              </div>
              <div>
                 <h3 className="text-sm font-medium text-slate-500 mb-1">Total Quotes</h3>
                 <span className="text-3xl font-bold text-slate-800 tracking-tight">{quotes.total_quotes ?? 0}</span>
              </div>
              <div className="mt-6 h-12 w-full opacity-70 group-hover:opacity-100 transition-opacity">
                 <QuotesTrendChart data={quoteTrendData} />
              </div>
           </div>
        </div>

        {/* Users KPI */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 </div>
                 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${users.users_7d > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {users.users_7d > 0 ? `+${users.users_7d} new users` : "No new users"}
                 </span>
              </div>
              <div>
                 <h3 className="text-sm font-medium text-slate-500 mb-1">Total Users</h3>
                 <span className="text-3xl font-bold text-slate-800 tracking-tight">{users.total_users ?? 0}</span>
              </div>
              <div className="mt-6">
                 <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Growth Target</span>
                    <span>{Math.min(100, Math.round(((users.users_7d || 0) / Math.max(1, users.total_users || 1)) * 100))}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, ((users.users_7d || 0) / Math.max(1, users.total_users || 1)) * 100)}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-400/20 rounded-full -ml-10 -mb-10 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
           
           <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1">Quick Actions</h3>
              <p className="text-sky-100 text-sm mb-6 opacity-90">Manage your store efficiently.</p>
           </div>
           <div className="grid grid-cols-2 gap-3 relative z-10">
              <Link href="/admin/products" className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3 text-center transition-all hover:-translate-y-0.5 border border-white/5 hover:border-white/20">
                 <div className="text-xl mb-1 drop-shadow-md">📦</div>
                 <span className="text-xs font-bold tracking-wide">Add Product</span>
              </Link>
              <Link href="/admin/quotes" className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3 text-center transition-all hover:-translate-y-0.5 border border-white/5 hover:border-white/20">
                 <div className="text-xl mb-1 drop-shadow-md">💬</div>
                 <span className="text-xs font-bold tracking-wide">View Quotes</span>
              </Link>
              <Link href="/admin/promotion" className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3 text-center transition-all hover:-translate-y-0.5 border border-white/5 hover:border-white/20">
                 <div className="text-xl mb-1 drop-shadow-md">🏷️</div>
                 <span className="text-xs font-bold tracking-wide">Promotions</span>
              </Link>
              <Link href="/admin/carousel" className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3 text-center transition-all hover:-translate-y-0.5 border border-white/5 hover:border-white/20">
                 <div className="text-xl mb-1 drop-shadow-md">🖼️</div>
                 <span className="text-xs font-bold tracking-wide">Carousel</span>
              </Link>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Top Products Chart */}
         <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-slate-800">Product Interest</h3>
                     <p className="text-sm text-slate-500">Based on search & view queries</p>
                  </div>
               </div>
               <Link href="/admin/products" className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-lg transition-colors border border-slate-200">View All</Link>
            </div>
            <div className="h-64 w-full">
               <TopProductsBarChart products={topProducts} />
            </div>
         </div>

         {/* Top Products List */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-0 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-slate-800">Top Items</h3>
                     <p className="text-sm text-slate-500">High engagement</p>
                  </div>
               </div>
            </div>
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
               {topProducts.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                     <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                     <p className="text-sm">No data available yet</p>
                  </div>
               ) : (
                  topProducts.map((p, i) => (
                     <div key={p.barcode} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-default">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${
                           i === 0 ? "bg-yellow-100 text-yellow-700" : 
                           i === 1 ? "bg-slate-200 text-slate-700" : 
                           i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
                        }`}>
                           {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-sky-600 transition-colors">{p.productname}</h4>
                           <p className="text-xs text-slate-400 truncate font-mono">#{p.barcode}</p>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-100 group-hover:bg-sky-50 text-slate-600 group-hover:text-sky-600 text-xs font-bold rounded-lg transition-colors">
                           {p.itemquery}
                        </div>
                     </div>
                  ))
               )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
               <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-sky-600 uppercase tracking-wide transition-colors">
                  Manage Inventory
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
