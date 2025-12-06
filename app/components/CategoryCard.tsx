import Image from "next/image";
import React from "react";

export type CategoryCardProps = {
  name: string;
  slug: string;
  img: string;
  href?: string;
};

export default function CategoryCard({ name, slug, img, href }: CategoryCardProps) {
  const link = href || `/categories/${slug}`;
  return (
    <a
      href={link}
      aria-label={`View ${name} category`}
      className="group block overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <div className="relative aspect-3/2 w-full bg-zinc-100">
        <Image
          src={img}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          unoptimized={img.startsWith("http")}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="transform-gpu rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow transition-transform duration-500 group-hover:scale-110">
            {name}
          </div>
        </div>
      </div>
    </a>
  );
}
