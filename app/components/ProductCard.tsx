"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

export type ProductCardProps = {
  id: number | string;
  name: string;
  price?: string;
  img: string;
  badge?: string;
  available?: boolean; // true = AVAILABLE, false = UNAVAILABLE
  onAdd?: (id: number | string) => void;
  onWish?: (id: number | string) => void;
  onDetailsHref?: string;
};

export default function ProductCard({
  id,
  name,
  img,
  badge,
  available = true,
  onAdd,
  onWish,
  onDetailsHref,
}: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden bg-zinc-100">
        <Image
          src={img}
          alt={name}
          layout="fill"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          loading="lazy"
        />
        {badge ? (
          <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold text-zinc-900 shadow">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{name}</h3>
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {available ? (
            <button
              onClick={() => onAdd?.(id)}
              className="inline-flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center rounded-full bg-amber-500 px-4 text-sm sm:text-xs font-semibold text-zinc-900 hover:bg-amber-400 whitespace-nowrap"
            >
              Add to Quote
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onWish?.(id)}
              title="Add to wishlist"
              aria-label="Add to wishlist"
              className="inline-flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center rounded-full border border-black/10 px-3 text-sm sm:text-xs font-semibold hover:bg-zinc-50 whitespace-nowrap gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-rose-600">
                <path d="M11.645 20.91l-.007-.003-.022-.01a15.247 15.247 0 01-.383-.176 25.18 25.18 0 01-4.244-2.712C4.688 16.182 2.25 13.743 2.25 10.5 2.25 7.98 4.227 6 6.75 6c1.61 0 3.204.808 4.152 2.09a5.21 5.21 0 014.098-2.09c2.523 0 4.5 1.98 4.5 4.5 0 3.243-2.438 5.682-4.739 7.51a25.175 25.175 0 01-4.244 2.712 15.247 15.247 0 01-.383.176l-.022.01-.007.003a.75.75 0 01-.614 0z" />
              </svg>
              <span className="hidden sm:inline">Wishlist</span>
            </button>
          )}
          {onDetailsHref ? (
            <Link
              href={onDetailsHref}
              className="inline-flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center rounded-full border border-black/10 px-4 text-sm sm:text-xs font-semibold hover:bg-zinc-50 whitespace-nowrap"
            >
              Details
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
