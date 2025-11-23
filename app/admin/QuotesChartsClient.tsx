"use client";

import React, { useState } from "react";

export type QuoteTrendPoint = { label: string; count: number };
export type QuotesTrendChartProps = { data: QuoteTrendPoint[] };

export function QuotesTrendChart({ data }: QuotesTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <p className="text-[11px] text-zinc-400">No quotes in the last 7 days.</p>;
  }

  const max = data.reduce((m, pt) => Math.max(m, pt.count), 0) || 1;

  return (
    <div className="relative h-16 w-full">
      {hoverIndex != null && data[hoverIndex] && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-[10px] text-white shadow">
          <div>{data[hoverIndex].label}</div>
          <div className="font-semibold">{data[hoverIndex].count} quotes</div>
        </div>
      )}
      <svg viewBox="0 0 100 40" className="h-full w-full">
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          points={data
            .map((pt, idx) => {
              const x = (idx / Math.max(1, data.length - 1)) * 100;
              const y = 38 - (pt.count / max) * 30;
              return `${x},${y}`;
            })
            .join(" ")}
        />
        {data.map((pt, idx) => {
          const x = (idx / Math.max(1, data.length - 1)) * 100;
          const y = 38 - (pt.count / max) * 30;
          const active = hoverIndex === idx;
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={active ? 2.5 : 1.8}
                fill={active ? "#f97316" : "#fbbf24"}
              />
              <rect
                x={Math.max(0, x - 5)}
                y={0}
                width={10}
                height={40}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export type TopProduct = { productname: string; barcode: string; itemquery: number };
export type TopProductsBarChartProps = { products: TopProduct[] };

export function TopProductsBarChart({ products }: TopProductsBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!products || products.length === 0) {
    return <p className="text-xs text-zinc-500">No product data available.</p>;
  }

  const max = products.reduce((m, p) => Math.max(m, p.itemquery), 0) || 1;

  return (
    <div className="mt-2 space-y-2">
      {products.map((p, idx) => {
        const width = Math.max(10, (p.itemquery / max) * 100);
        const active = activeIndex === idx;
        return (
          <div
            key={p.barcode}
            className={`space-y-1 rounded-md px-2 py-1 ${active ? "bg-amber-50" : ""}`}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center justify-between text-xs text-zinc-700">
              <span className="truncate max-w-[70%]">{p.productname}</span>
              <span className="font-mono text-[10px] text-zinc-500">{p.itemquery}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-2 rounded-full ${active ? "bg-amber-600" : "bg-amber-500"}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
      {activeIndex != null && products[activeIndex] && (
        <div className="mt-2 rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] text-zinc-800">
          <div className="font-medium truncate">{products[activeIndex].productname}</div>
          <div className="font-mono text-[10px] text-zinc-500 truncate">{products[activeIndex].barcode}</div>
          <div>{products[activeIndex].itemquery} itemquery hits</div>
        </div>
      )}
    </div>
  );
}
