import type { Metadata } from "next";

// Applies to /admin/login and the (dashboard) group below it — none of it
// belongs in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
