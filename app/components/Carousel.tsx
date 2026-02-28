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
    <div className={`relative overflow-hidden w-full bg-white ${className}`}>
      <div
        className="relative h-[300px] sm:h-[440px] md:h-[580px] select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute inset-0 flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((s) => (
            <div key={s.id} className="relative min-w-full h-full bg-slate-900">
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <img
                  src={s.img}
                  alt={s.title || "Slide image"}
                  className="w-full h-full object-fit-cover"
                  loading="lazy"
                />
              </div>

              {/* Enhanced Overlay with Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="container-custom h-full flex flex-col justify-end pb-20 sm:pb-24">
                  <div className="max-w-2xl transform transition-all duration-700 translate-y-0 opacity-100">
                    {s.title && (
                      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-md tracking-tight">
                        {s.title}
                      </h2>
                    )}
                    {s.subtitle && (
                      <p className="text-lg md:text-xl text-slate-200 mb-8 font-medium drop-shadow-sm max-w-xl leading-relaxed">
                        {s.subtitle}
                      </p>
                    )}
                    <a
                      href={s.href}
                      className="inline-flex items-center gap-2 h-12 md:h-14 rounded-full bg-sky-500 px-8 text-base md:text-lg font-bold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 hover:scale-105 transition-all duration-300 group"
                    >
                      {buttonLabel}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                        <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3a.75.75 0 010-1.5h16.19l-2.47-2.47a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modern Navigation Controls */}
        <div className="absolute bottom-8 right-8 flex gap-3 z-20">
          <button
            onClick={prev}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={next}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all duration-300 group"
            aria-label="Next slide"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Stylish Progress Indicators */}
        <div className="absolute bottom-8 left-8 flex gap-3 z-20">
           {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current ? "w-8 bg-sky-500" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
