"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

// A single row that scrolls sideways (tabs, days), with chevron buttons at each
// end that only appear when there is more to see in that direction. Works in
// RTL: "previous" always points to the reading start.
export function HorizontalScroller({
  children,
  label,
  className = "",
  trackClassName = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
  trackClassName?: string;
}) {
  const t = useTranslations("Common");
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const [rtl, setRtl] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const scrolled = Math.abs(el.scrollLeft); // negative in RTL
    const start = scrolled < 4;
    const end = scrolled + el.clientWidth >= el.scrollWidth - 4;
    setEdges((e) => (e.start === start && e.end === end ? e : { start, end }));
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    setRtl(getComputedStyle(el).direction === "rtl");
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [update]);

  function scroll(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: direction * (rtl ? -1 : 1) * el.clientWidth * 0.7, behavior: "smooth" });
  }

  const button =
    "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-[var(--shadow-soft)] transition-[opacity,transform] duration-200 hover:text-mulberry active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass";

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        onScroll={update}
        className={`no-scrollbar flex overflow-x-auto scroll-smooth ${trackClassName}`}
        // Fade whichever edge still has content beyond it.
        style={{
          maskImage: `linear-gradient(to ${rtl ? "left" : "right"}, ${edges.start ? "black" : "transparent"} 0, black 2.5rem, black calc(100% - 2.5rem), ${edges.end ? "black" : "transparent"} 100%)`,
        }}
      >
        {children}
      </div>
      {!edges.start && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={t("carouselPrev")}
          className={`${button} start-0`}
        >
          <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={t("carouselNext")}
          className={`${button} end-0`}
        >
          <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
