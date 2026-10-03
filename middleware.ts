import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { isCustomerRole, isStaffRole } from "@/lib/auth-roles";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const localePattern = routing.locales.join("|");
const adminPathRe = new RegExp(`^/(${localePattern})/admin(/.*)?$`);
const loginPathRe = new RegExp(`^/(${localePattern})/admin/login/?$`);
const accountPathRe = new RegExp(`^/(${localePattern})/account/?$`);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // A customer session is still a session — check the role, not just req.auth.
  if (
    adminPathRe.test(pathname) &&
    !loginPathRe.test(pathname) &&
    !isStaffRole(req.auth?.user?.role)
  ) {
    const locale = pathname.split("/")[1];
    const loginUrl = new URL(`/${locale}/admin/login`, req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (accountPathRe.test(pathname) && !isCustomerRole(req.auth?.user?.role)) {
    const locale = pathname.split("/")[1];
    return NextResponse.redirect(new URL(`/${locale}/account/login`, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
  runtime: "nodejs",
};
