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
  buttonLabel = "Checkout",
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
          className="absolute inset-0 flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((s) => (
            <div key={s.id} className="relative min-w-full">
              <img
                src={s.img}
                alt={s.title || "Slide image"}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />

              {/* Overlays for pro look */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/25 via-transparent to-black/10" />

              {/* Single CTA button centered */}
              <div className="absolute inset-0 z-10 grid place-items-center p-5 sm:p-8 md:p-12">
                <a
                  href={s.href}
                  className="inline-flex h-12 md:h-14 items-center rounded-full bg-amber-500/95 backdrop-blur px-6 md:px-8 text-base md:text-lg font-semibold text-zinc-900 shadow-lg hover:bg-amber-400"
                >
                  {buttonLabel}
                </a>
                {s.title ? <span className="sr-only">{s.title}</span> : null}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          aria-label="Previous slide"
          onClick={prev}
          className="absolute left-3 bottom-5 sm:left-4 sm:top-1/2 sm:-translate-y-1/2 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full bg-white/90 text-zinc-900 shadow hover:bg-white"
        >
          <span className="-mt-0.5 text-xl sm:text-2xl">‹</span>
        </button>
        <button
          aria-label="Next slide"
          onClick={next}
          className="absolute right-3 bottom-5 sm:right-4 sm:top-1/2 sm:-translate-y-1/2 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full bg-white/90 text-zinc-900 shadow hover:bg-white"
        >
          <span className="-mt-0.5 text-xl sm:text-2xl">›</span>
        </button>

        {/* Progress */}
        {auto && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-white/30">
            <div
              className="h-full bg-amber-500 transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Dots */}
        <div className="absolute bottom-4 sm:bottom-3 left-0 right-0 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full border border-white/60 transition-colors ${
                i === current ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
