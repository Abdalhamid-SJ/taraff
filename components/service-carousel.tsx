"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ServiceCard, type ServiceCardData } from "@/components/service-card";

// Interaction model adapted from 21st.dev "Snap Carousel" (ddoemonn): indicator
// pills, prev/next controls, keyboard support and dimmed off-screen slides. Built
// on a native scroll-snap track instead of a transform track so it handles RTL,
// touch momentum and screen-reader scrolling for free.

const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;

export function ServiceCarousel({
  services,
  label,
  fromLabel,
  heading,
}: {
  services: ServiceCardData[];
  label: string;
  fromLabel: string;
  heading: React.ReactNode;
}) {
  const t = useTranslations("Common");
  const reduce = useReducedMotion();
  const hintId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [visible, setVisible] = useState<Set<number>>(() => new Set([0]));
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const first = visible.size ? Math.min(...visible) : 0;

  // Which cards are (mostly) on screen: drives the indicator and the dimming.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const i = Number((entry.target as HTMLElement).dataset.index);
            if (entry.intersectionRatio >= 0.6) next.add(i);
            else next.delete(i);
          }
          return next;
        });
      },
      { root: track, threshold: [0, 0.6, 1] },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [services.length]);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // scrollLeft is negative in RTL, so compare magnitudes.
    const scrolled = Math.abs(track.scrollLeft);
    const atStart = scrolled < 4;
    const atEnd = scrolled + track.clientWidth >= track.scrollWidth - 4;
    setEdges((e) => (e.atStart === atStart && e.atEnd === atEnd ? e : { atStart, atEnd }));
  }, []);

  useEffect(() => {
    updateEdges();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateEdges]);

  const scrollToIndex = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const el = itemRefs.current[Math.max(0, Math.min(services.length - 1, i))];
      if (!track || !el) return;
      // Scroll the track only (scrollIntoView would also scroll the page).
      const trackBox = track.getBoundingClientRect();
      const elBox = el.getBoundingClientRect();
      const rtl = getComputedStyle(track).direction === "rtl";
      const padStart = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
      const delta = rtl
        ? elBox.right - (trackBox.right - padStart)
        : elBox.left - (trackBox.left + padStart);
      track.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
    },
    [services.length, reduce],
  );

  const page = Math.max(1, visible.size);
  const prev = () => scrollToIndex(first - page);
  const next = () => scrollToIndex(first + page);

  // Mouse drag-to-scroll (touch and trackpads already scroll natively).
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.dragging = "true";
    }
    if (d.moved) e.currentTarget.scrollLeft = d.left - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const track = e.currentTarget;
    delete track.dataset.dragging;
    // Swallow the click that follows a drag so it doesn't open a card.
    const block = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    track.addEventListener("click", block, { capture: true, once: true });
    setTimeout(() => track.removeEventListener("click", block, { capture: true }), 0);
    // Removing data-dragging re-enables snap, which settles on the nearest card.
  };

  const buttonClass =
    "flex size-12 items-center justify-center rounded-full border border-ink/12 bg-white text-ink shadow-[var(--shadow-soft)] transition-[transform,background-color,color,opacity,border-color] duration-200 hover:border-mulberry/30 hover:text-mulberry active:scale-95 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{heading}</div>

      <ul
        ref={trackRef}
        id={hintId + "track"}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        aria-describedby={hintId}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-6 [--gutter:1rem] [scroll-padding-inline:var(--gutter)] [padding-inline:var(--gutter)] focus-visible:outline-none sm:[--gutter:1.5rem] md:cursor-grab data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none data-[dragging=true]:select-none lg:[--gutter:max(1.5rem,calc((100%-72rem)/2+1.5rem))]"
      >
        {services.map((service, i) => (
          <motion.li
            key={service.id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            data-index={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${services.length}`}
            className="w-[78%] shrink-0 snap-start sm:w-[22rem] lg:w-[23rem]"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: Math.min(i, 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className={`transition-[opacity,scale] duration-500 ease-[var(--ease-out-expo)] ${
                visible.has(i) ? "opacity-100" : "scale-[0.97] opacity-55"
              }`}
            >
              <ServiceCard service={service} fromLabel={fromLabel} />
            </div>
          </motion.li>
        ))}
      </ul>

      {services.length > 1 && (
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {services.length <= 16 ? (
            <div className="-mx-1.5 flex min-w-0 flex-wrap items-center">
              {services.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-label={t("carouselGoTo", { n: i + 1 })}
                  aria-current={visible.has(i) ? "true" : undefined}
                  className="flex h-8 w-6 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
                >
                  <motion.span
                    initial={false}
                    animate={
                      visible.has(i)
                        ? { scaleX: 1, opacity: 1 }
                        : { scaleX: 0.4, opacity: 0.3 }
                    }
                    transition={reduce ? { duration: 0 } : SPRING}
                    className="block h-1.5 w-5 rounded-full bg-mulberry"
                  />
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={edges.atStart}
              aria-label={t("carouselPrev")}
              aria-controls={hintId + "track"}
              className={buttonClass}
            >
              <ArrowLeft className="size-5 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={edges.atEnd}
              aria-label={t("carouselNext")}
              aria-controls={hintId + "track"}
              className={buttonClass}
            >
              <ArrowRight className="size-5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      )}

      <p id={hintId} className="sr-only">
        {t("carouselHint")}
      </p>
    </div>
  );
}
