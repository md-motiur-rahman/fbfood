"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

export type Slide = {
  id: number | string;
  img: string;
  href: string; // link to navigate when pressing Checkout
  title?: string; // retained for a11y/SEO if needed later
  subtitle?: string; // retained but not displayed now
};

export default function Carousel({
  items,
  auto = true,
  interval = 5000,
  className = "",
  buttonLabel = "Check out",
}: {
  items: Slide[];
  auto?: boolean;
  interval?: number;
  className?: string;
  buttonLabel?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = (idx: number) => setCurrent((idx + items.length) % items.length);
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // Auto-advance with progress bar
  useEffect(() => {
    if (!auto || items.length <= 1) return;
    let start = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / interval) * 100);
      setProgress(pct);
      if (elapsed >= interval) {
        start = Date.now();
        next();
        setProgress(0);
      }
      timerRef.current = setTimeout(tick, 1000 / 60);
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [auto, interval, items.length, current]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch / swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  return (
    <div className={`relative w-full bg-slate-900 ${className}`}>
      <div
        className="relative w-full select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative w-full">
          {/* Active Image */}
          <div className="relative w-full">
            <img
              src={items[current].img}
              alt={items[current].title || "Slide image"}
              className="w-full h-auto block"
              loading="eager"
            />
            
            {/* Enhanced Overlay with Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
              <div className="container-custom h-full flex flex-col justify-end pb-2 sm:pb-8 md:pb-12 items-center text-center">
                <div className="max-w-2xl transform transition-all duration-700 translate-y-0 opacity-100 px-4 sm:px-0 w-full flex flex-col items-center pointer-events-auto pb-1 sm:pb-0">
                  {items[current].title && (
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-md tracking-tight">
                      {items[current].title}
                    </h2>
                  )}
                  {items[current].subtitle && (
                    <p className="text-sm sm:text-lg md:text-xl text-slate-200 mb-4 sm:mb-8 font-medium drop-shadow-sm max-w-xl leading-relaxed">
                      {items[current].subtitle}
                    </p>
                  )}
                  <a
                    href={items[current].href}
                    className="inline-flex items-center justify-center gap-1 sm:gap-1.5 h-7 sm:h-10 md:h-12 rounded-full bg-sky-500 px-3 sm:px-6 text-[10px] sm:text-sm md:text-base font-bold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 hover:scale-105 transition-all duration-300 group mx-auto w-max"
                  >
                    {buttonLabel}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform">
                      <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3a.75.75 0 010-1.5h16.19l-2.47-2.47a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Navigation Controls */}
        <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 flex gap-2 sm:gap-3 z-20 pointer-events-auto">
          <button
            onClick={prev}
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={next}
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all duration-300 group"
            aria-label="Next slide"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Stylish Progress Indicators */}
        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 flex gap-2 sm:gap-3 z-20">
           {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
                i === current ? "w-6 sm:w-8 bg-sky-500" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
