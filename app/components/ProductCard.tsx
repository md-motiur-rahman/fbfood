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
  darkTheme = false,
}: ProductCardProps & { darkTheme?: boolean }) {
  return (
    <article className={`group relative flex flex-col h-full overflow-hidden rounded-2xl transition-all duration-300 ${darkTheme ? 'bg-slate-800 border-slate-700 hover:shadow-sky-900/20' : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50'} border hover:-translate-y-1`}>
      <div className="relative aspect-square w-full overflow-hidden bg-white p-4 flex items-center justify-center">
        <Image
          src={img}
          alt={name}
          width={400}
          height={400}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          unoptimized={img.startsWith("http")}
        />
        {badge ? (
          <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-sky-200">
            {badge}
          </div>
        ) : null}
        
        {!available && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">Out of Stock</span>
           </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 p-5">
        <h3 className={`line-clamp-2 text-base font-bold mb-4 flex-1 ${darkTheme ? 'text-white' : 'text-slate-800'}`}>{name}</h3>
        
        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100/10">
          {available ? (
            <button
              onClick={() => onAdd?.(id)}
              className={`flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${darkTheme ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-900/50' : 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              Add to Quote
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onWish?.(id)}
              className={`flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 ${darkTheme ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-500">
                <path d="M11.645 20.91l-.007-.003-.022-.01a15.247 15.247 0 01-.383-.176 25.18 25.18 0 01-4.244-2.712C4.688 16.182 2.25 13.743 2.25 10.5 2.25 7.98 4.227 6 6.75 6c1.61 0 3.204.808 4.152 2.09a5.21 5.21 0 014.098-2.09c2.523 0 4.5 1.98 4.5 4.5 0 3.243-2.438 5.682-4.739 7.51a25.175 25.175 0 01-4.244 2.712 15.247 15.247 0 01-.383.176l-.022.01-.007.003a.75.75 0 01-.614 0z" />
              </svg>
              Wishlist
            </button>
          )}
          
          {onDetailsHref && (
            <Link
              href={onDetailsHref}
              className={`h-11 w-11 inline-flex items-center justify-center rounded-xl transition-all duration-200 ${darkTheme ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              title="View Details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
