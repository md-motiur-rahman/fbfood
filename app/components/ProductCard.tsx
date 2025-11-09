"use client";

import Image from "next/image";
import React from "react";

export type ProductCardProps = {
  id: number | string;
  name: string;
  price?: string;
  img: string;
  badge?: string;
  onAdd?: (id: number | string) => void;
  onDetailsHref?: string;
};

export default function ProductCard({
  id,
  name,
  img,
  badge,
  onAdd,
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
          <button
            onClick={() => onAdd?.(id)}
            className="inline-flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center rounded-full bg-amber-500 px-4 text-sm sm:text-xs font-semibold text-zinc-900 hover:bg-amber-400 whitespace-nowrap"
          >
            Add to Quote
          </button>
          {onDetailsHref ? (
            <a
              href={onDetailsHref}
              className="inline-flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center rounded-full border border-black/10 px-4 text-sm sm:text-xs font-semibold hover:bg-zinc-50 whitespace-nowrap"
            >
              Details
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
