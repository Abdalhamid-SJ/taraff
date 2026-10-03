"use client";

import { Fragment, useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ctaArrow, ctaPrimary, ctaSecondary } from "@/lib/cta";

const EASE = [0.16, 1, 0.3, 1] as const;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80&auto=format&fit=crop";
const DETAIL_IMAGE =
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&q=80&auto=format&fit=crop";

export function Hero({
  title,
  subtitle,
  cta,
  secondaryCta,
  imageAlt,
  detailAlt,
}: {
  title: string;
  subtitle: string;
  cta: string;
  secondaryCta: string;
  imageAlt: string;
  detailAlt: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mainY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const detailY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);

  const words = title.split(" ");

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
    >
      {/* Soft accent wash behind the composition. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 end-[-10%] size-[42rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--blush)_90%,var(--mulberry)),transparent)] opacity-70"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-10 pb-20 sm:px-6 md:pt-16 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-12 lg:gap-8 lg:py-16">
        <div className="lg:col-span-6">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            {words.map((word, i) => (
              // The space sits outside the clipped inline-block, where it can't collapse.
              <Fragment key={i}>
                <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1 + i * 0.07, ease: EASE }}
                  >
                    {word}
                  </motion.span>
                </span>
                {i < words.length - 1 && " "}
              </Fragment>
            ))}
          </h1>

          <motion.p
            className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink/70"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
          >
            {subtitle}
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
          >
            <Link href="/book" className={ctaPrimary}>
              {cta}
              <ArrowRight className={ctaArrow} aria-hidden="true" />
            </Link>
            <Link href="/services" className={ctaSecondary}>
              {secondaryCta}
            </Link>
          </motion.div>
        </div>

        <div className="relative lg:col-span-6">
          <motion.div
            style={{ y: mainY }}
            className="relative ms-auto aspect-[4/5] w-full max-w-[30rem] lg:w-[88%]"
          >
            <motion.div
              className="relative size-full overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-lift)]"
              initial={reduce ? false : { clipPath: "inset(12% 12% 12% 12% round 2.5rem)", scale: 1.04 }}
              animate={{ clipPath: "inset(0% 0% 0% 0% round 2.5rem)", scale: 1 }}
              transition={{ duration: 1.2, delay: 0.15, ease: EASE }}
            >
              <Image
                src={HERO_IMAGE}
                alt={imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 30rem, 90vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: detailY }}
            className="absolute -bottom-8 start-0 w-[42%] max-w-[13rem] sm:-bottom-10 lg:start-[-2%]"
          >
            <motion.div
              className="relative aspect-square overflow-hidden rounded-[2rem] border-[6px] border-paper shadow-[var(--shadow-lift)]"
              initial={reduce ? false : { opacity: 0, y: 40, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 1, delay: 0.55, ease: EASE }}
            >
              <Image
                src={DETAIL_IMAGE}
                alt={detailAlt}
                fill
                sizes="13rem"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
