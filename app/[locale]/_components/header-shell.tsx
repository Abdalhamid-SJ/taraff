"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

// Sticky header chrome: transparent over the hero, frosted with a hairline once
// the page scrolls. Only flips state when crossing the threshold.
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 8;
    if (next !== scrolled) setScrolled(next);
  });

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-ink/8 bg-paper/80 shadow-[0_8px_24px_-16px_rgb(60_20_40/0.2)] backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-paper/0"
      }`}
    >
      {children}
    </header>
  );
}
