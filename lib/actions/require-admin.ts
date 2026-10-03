import { auth } from "@/auth";
import { isCustomerRole, isStaffRole } from "@/lib/auth-roles";

// Defense in depth: middleware gates /admin page navigation, but every
// mutating Server Action re-checks the session itself rather than relying
// solely on the middleware matcher. Customers have sessions too, so this must
// check the role — "signed in" alone is not "is staff".
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireCustomerSession() {
  const session = await auth();
  if (!session?.user || !isCustomerRole(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}
