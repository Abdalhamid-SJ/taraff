"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/admin", key: "today" },
  { href: "/admin/bookings", key: "bookings" },
  { href: "/admin/services", key: "services" },
  { href: "/admin/beauticians", key: "beauticians" },
  { href: "/admin/settings", key: "settings" },
] as const;

export function AdminNav() {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6"
      aria-label={t("navLabel")}
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
              active
                ? "border-mulberry text-mulberry"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
