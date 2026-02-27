"use client";

import { useRouter } from "next/navigation";
import React from "react";

type Category = {
  name: string;
  slug: string;
};

export default function CategorySelect({ categories }: { categories: Category[] }) {
  const router = useRouter();

  return (
    <div className="relative">
      <select
        defaultValue=""
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            router.push(`/categories/${val}`);
          }
        }}
        className="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-8 text-base text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        <option value="" disabled>
          Select a category...
        </option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
