"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { CalendarClock, House, Sparkles } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const ICONS = [Sparkles, CalendarClock, House];
const IMAGE =
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80&auto=format&fit=crop";

export function HowItWorks({
  heading,
  steps,
  imageAlt,
}: {
  heading: string;
  steps: { title: string; desc: string }[];
  imageAlt: string;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  // The rail fills as the steps pass the middle of the viewport, tying the
  // sequence to the reader's progress through it.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 65%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {heading}
            </h2>
            <motion.div
              className="relative mt-10 hidden aspect-[4/5] max-w-sm overflow-hidden rounded-[2rem] shadow-[var(--shadow-soft)] lg:block"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1, ease: EASE }}
            >
              <Image src={IMAGE} alt={imageAlt} fill sizes="24rem" className="object-cover" />
            </motion.div>
          </div>
        </div>

        <ol ref={listRef} className="relative lg:col-span-7 lg:pt-4">
          {/* Progress rail behind the icons. */}
          <div
            aria-hidden="true"
            className="absolute start-7 top-7 bottom-7 w-px -translate-x-1/2 bg-ink/10 rtl:translate-x-1/2"
          >
            <motion.div
              style={{ scaleY: reduce ? 1 : fill }}
              className="size-full origin-top bg-mulberry"
            />
          </div>

          {steps.map((step, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <motion.li
                key={i}
                className="relative flex gap-6 pb-16 last:pb-0 sm:gap-8"
                initial={reduce ? false : { opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-paper text-mulberry shadow-[var(--shadow-soft)] ring-1 ring-mulberry/15">
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="pt-2.5">
                  <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink/70 sm:text-lg">
                    {step.desc}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
