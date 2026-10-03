"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";

const linkBase =
  "relative min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors duration-200 sm:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

// Main navigation. The link for the section you're in is highlighted (and
// marked aria-current), so the header tells you where you are; "Book now"
// is an outlined call to action that only fills in on the booking page.
export function NavLinks({
  labels,
}: {
  labels: { services: string; account: string; book: string };
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const pillId = useId();

  const inSection = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const links = [
    // Hidden on phones to keep the header on one line; reachable from the home page.
    { href: "/services", label: labels.services, className: "hidden sm:inline-flex" },
    // Sends signed-out visitors to the sign-in page (see middleware.ts), so
    // this one link works for both states and keeps pages cacheable.
    { href: "/account", label: labels.account, className: "inline-flex" },
  ];
  const bookActive = inSection("/book");

  return (
    <>
      {links.map((link) => {
        const active = inSection(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`${link.className} ${linkBase} ${
              active ? "text-mulberry" : "text-ink/75 hover:bg-blush/70 hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-full bg-blush"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}

      <Link
        href="/book"
        aria-current={bookActive ? "page" : undefined}
        className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border-[1.5px] border-mulberry px-4 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.97] sm:px-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
          bookActive
            ? "bg-mulberry text-paper shadow-[var(--shadow-soft)]"
            : "text-mulberry hover:-translate-y-px hover:bg-mulberry hover:text-paper hover:shadow-[var(--shadow-soft)]"
        }`}
      >
        {labels.book}
      </Link>
    </>
  );
}
