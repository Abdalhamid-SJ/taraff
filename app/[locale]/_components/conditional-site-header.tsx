"use client";

import { usePathname } from "@/i18n/navigation";

export function ConditionalSiteHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
