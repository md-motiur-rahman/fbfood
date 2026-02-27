import Image from "next/image";
import Link from "next/link";
import React from "react";

export type CategoryCardProps = {
  name: string;
  slug: string;
  img: string;
  href?: string;
};

export default function CategoryCard({ name, slug, img, href }: CategoryCardProps) {
  const link = href || `/categories/${slug}`;
  
  // Use a default placeholder if image is missing or broken url
  const imageSrc = img && img.length > 0 ? img : "/placeholder-category.png";

  return (
    <Link
      href={link}
      aria-label={`View ${name} category`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          unoptimized={imageSrc.startsWith("http")}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
        
        {/* Floating Icon/Badge Effect */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sky-500">
            <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="p-5 relative z-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-lg font-bold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-1">{name}</h3>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
           <span className="font-medium text-slate-500 group-hover:text-sky-500 transition-colors">View Products</span>
           <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
             </svg>
           </span>
        </div>
      </div>
    </Link>
  );
}
