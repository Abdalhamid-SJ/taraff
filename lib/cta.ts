// Shared call-to-action styles for <Link>s that look like buttons. One radius
// system site-wide: interactive controls are full pills, surfaces are 1.5-2.5rem.

const base =
  "group/cta inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-base font-medium transition-[transform,background-color,box-shadow,color] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

export const ctaPrimary = `${base} bg-mulberry text-paper shadow-[var(--shadow-lift)] hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--mulberry)_88%,black)]`;

export const ctaSecondary = `${base} border border-ink/15 bg-white/60 text-ink backdrop-blur hover:border-mulberry/40 hover:bg-white hover:text-mulberry`;

export const ctaOnAccent = `${base} bg-paper text-mulberry shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)] hover:-translate-y-0.5 hover:bg-white`;

// Arrow that nudges forward on hover. Flips in RTL so it always points "onward".
export const ctaArrow =
  "size-4 transition-transform duration-200 ease-[var(--ease-out-expo)] group-hover/cta:translate-x-1 rtl:-scale-x-100 rtl:group-hover/cta:-translate-x-1";
