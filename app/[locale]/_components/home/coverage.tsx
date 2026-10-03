"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MapPin } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Regions as tabs, areas as pills. Replaces a wall of comma-separated lists so
// visitors scan one region at a time.
export function Coverage({
  heading,
  subheading,
  regions,
  countLabels,
}: {
  heading: string;
  subheading: string;
  regions: { name: string; areas: { id: string; name: string }[] }[];
  countLabels: string[];
}) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const baseId = useId();
  const region = regions[active];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let next = active;
    if (e.key === forward) next = (active + 1) % regions.length;
    else if (e.key === back) next = (active - 1 + regions.length) % regions.length;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-blush/60 px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
        <div className="max-w-xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {heading}
          </h2>
          <p className="mt-4 text-lg text-ink/70">{subheading}</p>
        </div>

        {regions.length > 1 && (
          <div
            role="tablist"
            aria-label={heading}
            onKeyDown={onKeyDown}
            className="no-scrollbar mt-10 -mx-2 flex gap-1 overflow-x-auto px-2 py-1"
          >
            {regions.map((r, i) => (
              <button
                key={r.name}
                id={`${baseId}-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={i === active}
                aria-controls={`${baseId}-panel`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                className={`relative min-h-11 shrink-0 rounded-full px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                  i === active ? "text-paper" : "text-ink/70 hover:text-ink"
                }`}
              >
                {i === active && (
                  <motion.span
                    layoutId={`${baseId}-pill`}
                    className="absolute inset-0 rounded-full bg-mulberry"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{r.name}</span>
              </button>
            ))}
          </div>
        )}

        <div
          id={`${baseId}-panel`}
          role={regions.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={regions.length > 1 ? `${baseId}-tab-${active}` : undefined}
          className="mt-8"
        >
          {regions.length === 1 && (
            <h3 className="font-display text-xl font-semibold text-mulberry">{region.name}</h3>
          )}
          <p className="mt-1 text-sm text-ink/60">{countLabels[active]}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={region.name}
              className="mt-5 flex flex-wrap gap-2.5"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduce ? 0 : 0.025 } },
                exit: { opacity: 0, transition: { duration: 0.12 } },
              }}
            >
              {region.areas.map((area) => (
                <motion.li
                  key={area.id}
                  variants={{
                    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.96 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-sm text-ink shadow-[var(--shadow-soft)]"
                >
                  <MapPin className="size-3.5 text-mulberry" aria-hidden="true" />
                  {area.name}
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
